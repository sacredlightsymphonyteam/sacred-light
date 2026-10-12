// Supabase Edge Function: homage
//
// The single server-side door to the Homage Portal (/homage). The page itself is
// static and the repo is public, so every lock lives here, never in the browser:
//   enter       — checks the shared password, returns a signed session token
//   state       — what this session has done so far (release, upload)
//   sign-stub   — PLACEHOLDER for the e-signature step (see HOMAGE_SIGNING_MODE)
//   guide       — time-limited links to the guide track (only after the release)
//   upload-url  — a one-off signed upload URL with the server-chosen file name
//   complete    — records an upload once the file has arrived
//   gratitude   — a written message for the Living Book of Gratitude
//
// The portal's tables and bucket have no public access at all; this function
// reaches them with the service role.
//
// Secrets (set with `supabase secrets set`, or Dashboard → Edge Functions → Secrets):
//   HOMAGE_PASSWORDS        — one password, or JSON of tier → password, e.g.
//                             {"circle":"…","invitees":"…"}. Rotate by changing it.
//   HOMAGE_SESSION_SECRET   — long random string that signs session tokens
//   HOMAGE_SIGNING_MODE     — 'stub' (default) until an e-signature provider is wired in
//   HOMAGE_MAX_UPLOAD_MB    — per-file cap (default 50, the free-plan storage limit)
//   HOMAGE_ALLOWED_ORIGINS  — optional comma list of extra origins (deploy previews)

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SESSION_SECRET = Deno.env.get('HOMAGE_SESSION_SECRET') ?? ''
const SIGNING_MODE = Deno.env.get('HOMAGE_SIGNING_MODE') === 'provider' ? 'provider' : 'stub'
const MAX_UPLOAD_MB = Number(Deno.env.get('HOMAGE_MAX_UPLOAD_MB') ?? '50') || 50
const ORIGINS = [
  'https://sacredlightsymphony.org',
  'http://localhost:5173',
  ...(Deno.env.get('HOMAGE_ALLOWED_ORIGINS') ?? '').split(',').map((o) => o.trim()).filter(Boolean),
]

const BUCKET = 'homage-private'
const SESSION_HOURS = 12
const MAX_FAILED_ATTEMPTS = 8 // per address, per 15 minutes
const MAX_MESSAGE = 2000
const AUDIO_EXT = ['wav', 'aif', 'aiff', 'flac', 'mp3', 'm4a']
const VIDEO_EXT = ['mp4', 'mov']

const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
  auth: { persistSession: false },
})

type Body = Record<string, unknown>
type Session = { tier: string; sid?: string; exp: number }
type Submission = { id: string; artist_name: string; email: string; release_status: string }

/** Thrown to answer the browser with an error code the page knows how to word. */
class Fail extends Error {
  constructor(public code: string, public status = 400) {
    super(code)
  }
}

// ── Tokens & passwords ───────────────────────────────────────────────────────
const enc = new TextEncoder()

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data))))
}

/** Constant-time comparison, so a wrong guess reveals nothing through timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function signToken(session: Session): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(session)))
  return `${body}.${await hmac(body)}`
}

async function readToken(token: unknown): Promise<Session> {
  const [body, sig] = typeof token === 'string' ? token.split('.') : []
  if (!body || !sig || !safeEqual(sig, await hmac(body))) throw new Fail('session_expired', 401)
  const bytes = Uint8Array.from(atob(body.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))
  const session = JSON.parse(new TextDecoder().decode(bytes)) as Session
  if (session.exp < Date.now()) throw new Fail('session_expired', 401)
  return session
}

function newSession(tier: string, sid?: string): Session {
  return { tier, sid, exp: Date.now() + SESSION_HOURS * 3600_000 }
}

/** Tier → password pairs from the HOMAGE_PASSWORDS secret (plain string = one tier). */
function passwords(): Array<[string, string]> {
  const raw = (Deno.env.get('HOMAGE_PASSWORDS') ?? '').trim()
  if (!raw) return []
  if (!raw.startsWith('{')) return [['default', raw]]
  try {
    return Object.entries(JSON.parse(raw)).map(([tier, pw]) => [tier, String(pw)])
  } catch {
    return []
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const text = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const extOf = (fileName: string) => (fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : '')

/** "Tina Turner" → "TinaTurner" — the ArtistName part of a stored file name. */
function safeName(name: string): string {
  const words = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, ' ').trim().split(' ')
  const joined = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
  return joined.slice(0, 60) || 'Contributor'
}

/** First unused `folder/base.ext`; a second file the same day becomes base_2, base_3… */
async function freeKey(folder: string, base: string, ext: string): Promise<string> {
  const { data } = await db.storage.from(BUCKET).list(folder, { search: base, limit: 100 })
  const taken = new Set((data ?? []).map((o) => o.name.replace(/\.[^.]+$/, '')))
  let stem = base
  for (let n = 2; taken.has(stem); n++) stem = `${base}_${n}`
  return `${folder}/${stem}.${ext}`
}

async function getSubmission(session: Session): Promise<Submission | null> {
  if (!session.sid) return null
  const { data } = await db
    .from('homage_submissions')
    .select('id, artist_name, email, release_status')
    .eq('id', session.sid)
    .maybeSingle()
  return (data as Submission) ?? null
}

/** The guide track and the upload stay locked until the release is done. */
function released(sub: Submission | null): sub is Submission {
  if (!sub) return false
  return sub.release_status === 'completed' || (SIGNING_MODE === 'stub' && sub.release_status === 'stub')
}

async function stateOf(session: Session) {
  const sub = await getSubmission(session)
  let submitted = false
  if (sub) {
    const { count } = await db
      .from('homage_uploads')
      .select('id', { count: 'exact', head: true })
      .eq('submission_id', sub.id)
      .eq('kind', 'humming')
    submitted = (count ?? 0) > 0
  }
  return {
    signingMode: SIGNING_MODE,
    release: sub?.release_status ?? 'none',
    artistName: sub?.artist_name ?? null,
    submitted,
    maxUploadMb: MAX_UPLOAD_MB,
  }
}

// ── Actions ──────────────────────────────────────────────────────────────────
async function enter(body: Body, req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  const ipHash = await hmac(`ip:${ip}`) // never store the raw address
  const since = new Date(Date.now() - 15 * 60_000).toISOString()
  const { count } = await db
    .from('homage_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', since)
  if ((count ?? 0) >= MAX_FAILED_ATTEMPTS) throw new Fail('too_many_attempts', 429)

  const given = await hmac(`pw:${text(body.password, 500)}`)
  let tier: string | null = null
  for (const [name, pw] of passwords()) {
    if (safeEqual(given, await hmac(`pw:${pw}`))) tier = name
  }
  if (!tier) {
    await db.from('homage_attempts').insert({ ip_hash: ipHash })
    throw new Fail('wrong_password', 401)
  }

  const session = newSession(tier)
  return { token: await signToken(session), state: await stateOf(session) }
}

// PLACEHOLDER for the e-signature step. It records who is contributing so the
// rest of the flow can be built and tested; it is NOT a signed release, and it
// refuses to run once HOMAGE_SIGNING_MODE is 'provider'.
async function signStub(body: Body, session: Session) {
  if (SIGNING_MODE !== 'stub') throw new Fail('unavailable', 403)
  const signerName = text(body.signerName)
  const artistName = text(body.artistName)
  const email = text(body.email)
  if (!signerName || !artistName || !isEmail(email) || body.agreed !== true) throw new Fail('invalid_details')

  const { data, error } = await db
    .from('homage_submissions')
    .insert({
      access_tier: session.tier,
      signer_name: signerName,
      artist_name: artistName,
      email,
      on_behalf_of: text(body.onBehalfOf) || null,
      release_status: 'stub',
      release_provider: 'stub',
    })
    .select('id')
    .single()
  if (error || !data) throw new Fail('unavailable', 500)

  const next = newSession(session.tier, data.id as string)
  return { token: await signToken(next), state: await stateOf(next) }
}

async function guide(session: Session) {
  if (!released(await getSubmission(session))) throw new Fail('release_required', 403)
  const { data } = await db.storage.from(BUCKET).list('guide', { limit: 100 })
  const files = (data ?? []).map((o) => o.name)
  const stream = files.find((f) => /\.(mp3|m4a|wav|ogg)$/i.test(f))
  const pack = files.find((f) => /\.zip$/i.test(f))

  const link = async (name: string | undefined, download: boolean) => {
    if (!name) return null
    const { data: signed } = await db.storage
      .from(BUCKET)
      .createSignedUrl(`guide/${name}`, 3600, download ? { download: name } : undefined)
    return signed ? { url: signed.signedUrl, name } : null
  }
  return { guide: { stream: await link(stream, false), download: await link(pack, true) } }
}

/** Where a contribution of this kind is filed, and under whose name. */
async function destination(body: Body, session: Session) {
  if (body.kind === 'humming') {
    const sub = await getSubmission(session)
    if (!released(sub)) throw new Fail('release_required', 403)
    return { folder: 'submissions', label: 'Submission', name: sub.artist_name, email: sub.email, sub }
  }
  if (body.kind === 'gratitude') {
    // The Living Book is independent of the humming contribution — password only.
    const name = text(body.name)
    if (!name) throw new Fail('invalid_details')
    return { folder: 'gratitude', label: 'Gratitude', name, email: text(body.email) || null, sub: await getSubmission(session) }
  }
  throw new Fail('invalid_details')
}

async function uploadUrl(body: Body, session: Session) {
  const dest = await destination(body, session)
  const ext = extOf(text(body.fileName, 300))
  const allowed = body.mediaType === 'audio' ? AUDIO_EXT : body.mediaType === 'video' ? VIDEO_EXT : []
  if (!allowed.includes(ext)) throw new Fail('file_type')
  if (!(Number(body.size) > 0) || Number(body.size) > MAX_UPLOAD_MB * 1024 * 1024) throw new Fail('file_too_large')

  // Auto-rename on arrival: ArtistName_Submission_Date (brief, Step 3).
  const date = new Date().toISOString().slice(0, 10)
  const key = await freeKey(dest.folder, `${safeName(dest.name)}_${dest.label}_${date}`, ext)
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(key)
  if (error || !data) throw new Fail('unavailable', 500)
  return { path: key, signedUrl: data.signedUrl }
}

async function complete(body: Body, session: Session) {
  const dest = await destination(body, session)
  const path = text(body.path, 400)
  const fileName = path.split('/').pop() ?? ''
  // Only a file this session was just issued a URL for: right folder, right name.
  if (!path.startsWith(`${dest.folder}/${safeName(dest.name)}_${dest.label}_`)) throw new Fail('invalid_details')
  const { data } = await db.storage.from(BUCKET).list(dest.folder, { search: fileName, limit: 10 })
  const stored = (data ?? []).find((o) => o.name === fileName)
  if (!stored) throw new Fail('upload_failed')

  const { error } = await db.from('homage_uploads').insert({
    submission_id: dest.sub?.id ?? null,
    access_tier: session.tier,
    kind: body.kind === 'humming' ? 'humming' : 'gratitude_note',
    contributor_name: dest.name,
    contributor_email: dest.email,
    media_type: body.mediaType === 'video' ? 'video' : 'audio',
    file_path: path,
    original_name: text(body.fileName, 300) || null,
    file_size: (stored.metadata?.size as number | undefined) ?? null,
  })
  if (error) throw new Fail('unavailable', 500)
  return { fileName, state: await stateOf(session) }
}

async function gratitude(body: Body, session: Session) {
  const name = text(body.name)
  const message = text(body.message, MAX_MESSAGE)
  if (!name || !message) throw new Fail('invalid_details')
  const sub = await getSubmission(session)
  const { error } = await db.from('homage_uploads').insert({
    submission_id: sub?.id ?? null,
    access_tier: session.tier,
    kind: 'gratitude_message',
    contributor_name: name,
    contributor_email: text(body.email) || null,
    message,
  })
  if (error) throw new Fail('unavailable', 500)
  return { ok: true }
}

// ── HTTP ─────────────────────────────────────────────────────────────────────
serve(async (req) => {
  const origin = req.headers.get('origin') ?? ''
  const cors = {
    'Access-Control-Allow-Origin': ORIGINS.includes(origin) ? origin : ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, 'content-type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'unavailable' }, 405)

  try {
    // Fail closed: without a signing secret and at least one password, nobody gets in.
    if (!SESSION_SECRET || passwords().length === 0) throw new Fail('unavailable', 503)

    const body = (await req.json().catch(() => ({}))) as Body
    if (body.action === 'enter') return json(await enter(body, req))

    const session = await readToken(body.token)
    switch (body.action) {
      case 'state':
        return json({ state: await stateOf(session) })
      case 'sign-stub':
        return json(await signStub(body, session))
      case 'guide':
        return json(await guide(session))
      case 'upload-url':
        return json(await uploadUrl(body, session))
      case 'complete':
        return json(await complete(body, session))
      case 'gratitude':
        return json(await gratitude(body, session))
      default:
        throw new Fail('unavailable', 404)
    }
  } catch (e) {
    if (e instanceof Fail) return json({ error: e.code }, e.status)
    console.error('homage error', e)
    return json({ error: 'unavailable' }, 500)
  }
})

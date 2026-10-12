import { isSupabaseConfigured } from './supabase'

/**
 * The single seam between the Homage Portal page and its backend.
 *
 * Every lock on the portal is enforced by the `homage` Edge Function
 * (supabase/functions/homage) — this file only calls it and keeps the session
 * token for the tab. Nothing here is a secret: the password is checked on the
 * server, and the guide track and uploads are only ever reached through
 * short-lived signed URLs the function hands out.
 *
 * With no backend connected (local dev without a `.env`), it runs as a local
 * preview so the whole flow can be walked through — the same idea as the
 * contribution form's preview mode. The preview only exists in dev builds.
 */

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const HOMAGE_PREVIEW = import.meta.env.DEV && !isSupabaseConfigured

export type MediaType = 'audio' | 'video'
export type UploadKind = 'humming' | 'gratitude'

export const AUDIO_EXT = ['wav', 'aif', 'aiff', 'flac', 'mp3', 'm4a']
export const VIDEO_EXT = ['mp4', 'mov']
export const MAX_GRATITUDE_MESSAGE = 2000
export const MAX_NOTE_SECONDS = 60

export type HomageState = {
  /** 'stub' until an e-signature provider is connected (see the Edge Function). */
  signingMode: 'stub' | 'provider'
  release: 'none' | 'pending' | 'stub' | 'completed' | 'declined'
  artistName: string | null
  /** True once at least one humming contribution has arrived. */
  submitted: boolean
  maxUploadMb: number
}

export type GuideLink = { url: string; name: string }
export type GuideTrack = { stream: GuideLink | null; download: GuideLink | null }

export type ReleaseDetails = {
  signerName: string
  artistName: string
  email: string
  onBehalfOf?: string
  agreed: boolean
}

/** An error code from the portal backend; `homageMessage` turns it into words. */
export class HomageError extends Error {
  code: string
  constructor(code: string) {
    super(code)
    this.code = code
  }
}

export function homageMessage(e: unknown, maxUploadMb = 50): string {
  switch (e instanceof HomageError ? e.code : '') {
    case 'wrong_password':
      return 'That password was not recognised. Please check your invitation and try again.'
    case 'too_many_attempts':
      return 'Too many attempts. Please wait fifteen minutes and try again.'
    case 'session_expired':
      return 'Your session has ended. Please enter the password again.'
    case 'release_required':
      return 'Please complete Step 1 first.'
    case 'invalid_details':
      return 'Please complete the required fields.'
    case 'file_type':
      return 'This kind of file cannot be accepted here. Please choose one of the listed formats.'
    case 'file_too_large':
      return `This file is too large. Please choose one smaller than ${maxUploadMb} MB.`
    case 'too_long':
      return `Please keep the recorded note to ${MAX_NOTE_SECONDS} seconds or less.`
    case 'upload_failed':
      return 'The upload was interrupted. Please try again.'
    default:
      return 'Something interrupted the connection. Please try again in a moment.'
  }
}

export const extOf = (fileName: string) =>
  fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : ''

/** Audio or video, judged by file extension; null when it is neither. */
export function mediaTypeOf(fileName: string): MediaType | null {
  const ext = extOf(fileName)
  if (AUDIO_EXT.includes(ext)) return 'audio'
  if (VIDEO_EXT.includes(ext)) return 'video'
  return null
}

// ── Session token (kept for this browser tab only) ───────────────────────────
const TOKEN_KEY = 'sls_homage_token'

function readToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function storeToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable — the session simply won't survive a refresh */
  }
}

async function call<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  if (!url || !anonKey) throw new HomageError('unavailable')
  let res: Response
  try {
    res = await fetch(`${url}/functions/v1/homage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: anonKey, authorization: `Bearer ${anonKey}` },
      body: JSON.stringify({ action, token: readToken(), ...body }),
    })
  } catch {
    throw new HomageError('network')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (data.error === 'session_expired') storeToken(null)
    throw new HomageError(typeof data.error === 'string' ? data.error : 'unavailable')
  }
  if (typeof data.token === 'string') storeToken(data.token)
  return data as T
}

// ── Local preview (dev only, no backend) ─────────────────────────────────────
const preview: HomageState = {
  signingMode: 'stub',
  release: 'none',
  artistName: null,
  submitted: false,
  maxUploadMb: 50,
}
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ── API ──────────────────────────────────────────────────────────────────────
export async function enter(password: string): Promise<HomageState> {
  if (HOMAGE_PREVIEW) {
    await pause(400)
    if (!password.trim()) throw new HomageError('wrong_password')
    storeToken('preview')
    return { ...preview }
  }
  return (await call<{ state: HomageState }>('enter', { password })).state
}

/** Picks a session back up after a refresh. Null when there is none (or it expired). */
export async function resume(): Promise<HomageState | null> {
  if (!readToken()) return null
  if (HOMAGE_PREVIEW) return { ...preview }
  try {
    return (await call<{ state: HomageState }>('state')).state
  } catch {
    return null
  }
}

export function leave() {
  storeToken(null)
}

/** PLACEHOLDER for the e-signature step — records who is contributing. */
export async function confirmDetails(details: ReleaseDetails): Promise<HomageState> {
  if (HOMAGE_PREVIEW) {
    await pause(400)
    preview.release = 'stub'
    preview.artistName = details.artistName.trim()
    return { ...preview }
  }
  return (await call<{ state: HomageState }>('sign-stub', details)).state
}

export async function getGuide(): Promise<GuideTrack> {
  if (HOMAGE_PREVIEW) return { stream: null, download: null }
  return (await call<{ guide: GuideTrack }>('guide')).guide
}

/** Length of an audio/video file in seconds; null if the browser can't read it. */
function mediaDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const el = document.createElement(mediaTypeOf(file.name) === 'video' ? 'video' : 'audio')
    const src = URL.createObjectURL(file)
    const done = (seconds: number | null) => {
      URL.revokeObjectURL(src)
      resolve(seconds)
    }
    el.preload = 'metadata'
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? el.duration : null)
    el.onerror = () => done(null)
    el.src = src
  })
}

/** Checks a chosen file before any bytes are sent. Throws a HomageError if it can't be used. */
export async function checkFile(
  file: File,
  opts: { mediaType?: MediaType; maxMb: number; maxSeconds?: number },
): Promise<MediaType> {
  const type = mediaTypeOf(file.name)
  if (!type || (opts.mediaType && type !== opts.mediaType)) throw new HomageError('file_type')
  if (file.size > opts.maxMb * 1024 * 1024) throw new HomageError('file_too_large')
  if (opts.maxSeconds) {
    const seconds = await mediaDuration(file)
    // A second of grace; a file the browser can't measure is let through.
    if (seconds !== null && seconds > opts.maxSeconds + 1) throw new HomageError('too_long')
  }
  return type
}

/** PUT straight to storage. XHR rather than fetch, for upload progress events. */
function putWithProgress(signedUrl: string, file: File, onProgress: (fraction: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('apikey', anonKey as string)
    xhr.setRequestHeader('authorization', `Bearer ${anonKey}`)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total)
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new HomageError('upload_failed')))
    xhr.onerror = () => reject(new HomageError('upload_failed'))
    // Same multipart shape supabase-js sends to a signed upload URL.
    const body = new FormData()
    body.append('cacheControl', '3600')
    body.append('', file)
    xhr.send(body)
  })
}

export type UploadInput = {
  kind: UploadKind
  mediaType: MediaType
  file: File
  /** Living Book notes only — a humming upload is filed under the release's artist name. */
  name?: string
  email?: string
}

/**
 * Sends one file directly to private storage and records it. The server picks
 * the stored file name (ArtistName_Submission_Date); it is returned for the
 * confirmation screen.
 */
export async function uploadContribution(
  input: UploadInput,
  onProgress: (fraction: number) => void,
): Promise<{ fileName: string; state: HomageState }> {
  const { file, ...meta } = input
  const details = { ...meta, fileName: file.name, size: file.size }

  if (HOMAGE_PREVIEW) {
    for (let i = 1; i <= 20; i++) {
      await pause(90)
      onProgress(i / 20)
    }
    if (input.kind === 'humming') preview.submitted = true
    return { fileName: file.name, state: { ...preview } }
  }

  const { path, signedUrl } = await call<{ path: string; signedUrl: string }>('upload-url', details)
  await putWithProgress(signedUrl, file, onProgress)
  return call<{ fileName: string; state: HomageState }>('complete', { ...details, path })
}

export async function sendGratitudeMessage(entry: { name: string; email?: string; message: string }): Promise<void> {
  if (HOMAGE_PREVIEW) {
    await pause(400)
    return
  }
  await call('gratitude', entry)
}

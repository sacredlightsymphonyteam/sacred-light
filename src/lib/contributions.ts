import { supabase, isSupabaseConfigured, UPLOADS_BUCKET, CONTRIBUTIONS_TABLE } from './supabase'

/**
 * The single seam between the contribution funnel and the backend.
 *
 * - When Supabase is configured (env vars set), it uploads any creative files
 *   to Storage and inserts the contribution row (status 'pending' for review).
 * - Otherwise it saves locally for preview, so the funnel works before the
 *   backend is connected. The form code never changes either way.
 *
 * Still TODO once the emails are finalised: the transactional emails (receipt,
 * approved, declined, Nov 26) sent from a Supabase Edge Function so the Brevo
 * key never reaches the browser.
 */

export type Contribution = {
  // Section A — your details
  salutation: string
  firstName: string
  lastName: string
  email: string
  country: string
  language: string
  city?: string
  website?: string
  social?: string
  // Section B — your message
  title?: string
  displayName?: string
  message: string
  displayLanguage: string
  // Section C — creative contribution (all optional)
  photo?: File | null
  artwork?: File | null
  document?: File | null
  musicUrl?: string
  videoUrl?: string
  // Sections D & E
  newsletter: boolean
  consentOriginal: boolean
  consentPublish: boolean
  consentTranslate: boolean
}

export type SubmitResult = { ok: true; preview: boolean } | { ok: false; error: string }

export const MAX_MESSAGE = 3000
export const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB per the brief
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const STORAGE_KEY = 'sls_contributions'
const GENERIC_ERROR = 'Something interrupted the light. Please try again in a moment.'

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** Loose URL check for the optional website / music / video link fields. */
export function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value.includes('://') ? value : `https://${value}`)
    return Boolean(u.hostname.includes('.'))
  } catch {
    return false
  }
}

export function readContributions(): Array<Record<string, unknown>> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

/** The name shown publicly under a message — the chosen display name, else first name. */
export function publicName(data: Contribution): string {
  return (data.displayName?.trim() || data.firstName.trim())
}

function savePreview(data: Contribution): SubmitResult {
  const all = readContributions()
  all.push({
    ...data,
    photo: data.photo?.name,
    artwork: data.artwork?.name,
    document: data.document?.name,
    submittedAt: new Date().toISOString(),
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return { ok: true, preview: true }
}

async function uploadFile(file: File): Promise<string> {
  if (!supabase) throw new Error('no client')
  const ext = file.name.split('.').pop() || 'bin'
  const key = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(UPLOADS_BUCKET)
    .upload(key, file, { contentType: file.type })
  if (error) throw error
  return supabase.storage.from(UPLOADS_BUCKET).getPublicUrl(key).data.publicUrl
}

export async function submitContribution(data: Contribution): Promise<SubmitResult> {
  // Preview mode — no backend connected yet.
  if (!isSupabaseConfigured || !supabase) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 700)) // gentle pause; mimics the network
      return savePreview(data)
    } catch {
      return { ok: false, error: GENERIC_ERROR }
    }
  }

  // Live mode — upload any creative files (→ public URLs), then insert a pending row.
  try {
    const attachments: string[] = []
    for (const f of [data.photo, data.artwork, data.document]) {
      if (f) attachments.push(await uploadFile(f))
    }

    // status must be 'pending' (the RLS insert policy enforces it).
    // `name` / `location` mirror the granular fields so existing reads still work.
    const { error: insertError } = await supabase.from(CONTRIBUTIONS_TABLE).insert({
      salutation: data.salutation || null,
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      name: publicName(data),
      email: data.email.trim(),
      country: data.country.trim(),
      language: data.language || null,
      city: data.city?.trim() || null,
      location: data.country.trim(),
      website: data.website?.trim() || null,
      social: data.social?.trim() || null,
      title: data.title?.trim() || null,
      display_name: data.displayName?.trim() || null,
      message: data.message.trim(),
      display_language: data.displayLanguage || null,
      music_url: data.musicUrl?.trim() || null,
      video_url: data.videoUrl?.trim() || null,
      attachments,
      newsletter_opt_in: data.newsletter,
      consent_original: data.consentOriginal,
      consent_publish: data.consentPublish,
      consent_translate: data.consentTranslate,
      status: 'pending',
    })
    if (insertError) return { ok: false, error: GENERIC_ERROR }

    return { ok: true, preview: false }
  } catch {
    return { ok: false, error: GENERIC_ERROR }
  }
}

import { supabase, isSupabaseConfigured, UPLOADS_BUCKET, CONTRIBUTIONS_TABLE } from './supabase'

/**
 * The single seam between the contribution form and the backend.
 *
 * - When Supabase is configured (env vars set), it uploads any file to Storage
 *   and inserts the contribution row (status defaults to 'pending' for moderation).
 * - Otherwise it saves locally for preview, so the form works before the
 *   backend is connected. The form code never changes either way.
 *
 * Still TODO once the project exists: a Brevo confirmation email, sent from a
 * Supabase Edge Function so the API key never reaches the browser.
 */

export type Contribution = {
  message: string
  name: string
  email: string
  location?: string
  file?: File | null
}

export type SubmitResult = { ok: true; preview: boolean } | { ok: false; error: string }

export const MAX_MESSAGE = 600
export const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

const STORAGE_KEY = 'sls_contributions'
const GENERIC_ERROR = 'Something interrupted the light. Please try again in a moment.'

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function readContributions(): Array<Record<string, unknown>> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function savePreview(data: Contribution): SubmitResult {
  const all = readContributions()
  all.push({
    message: data.message,
    name: data.name,
    email: data.email,
    location: data.location,
    fileName: data.file?.name,
    submittedAt: new Date().toISOString(),
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return { ok: true, preview: true }
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

  // Live mode — upload any file (→ public URL), then insert a pending row.
  try {
    const attachments: string[] = []
    if (data.file) {
      const ext = data.file.name.split('.').pop() || 'bin'
      const key = `${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from(UPLOADS_BUCKET)
        .upload(key, data.file, { contentType: data.file.type })
      if (uploadError) return { ok: false, error: GENERIC_ERROR }
      const { data: pub } = supabase.storage.from(UPLOADS_BUCKET).getPublicUrl(key)
      attachments.push(pub.publicUrl)
    }

    // status must be 'pending' (the RLS insert policy enforces it).
    const { error: insertError } = await supabase.from(CONTRIBUTIONS_TABLE).insert({
      message: data.message,
      name: data.name,
      email: data.email,
      location: data.location ?? null,
      attachments,
      status: 'pending',
    })
    if (insertError) return { ok: false, error: GENERIC_ERROR }

    return { ok: true, preview: false }
  } catch {
    return { ok: false, error: GENERIC_ERROR }
  }
}

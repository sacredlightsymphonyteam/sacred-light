import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client. Created only when both env vars are present, so the app
 * (and the SSG build) work fine before the backend is connected — the
 * contribution form falls back to a local preview until then.
 *
 * Set these in a local `.env` (gitignored) — see `.env.example`:
 *   VITE_SUPABASE_URL=...
 *   VITE_SUPABASE_ANON_KEY=...
 * The anon key is safe to ship to the browser; access is governed by RLS.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null

export const CONTRIBUTIONS_TABLE = 'contributions'
export const SETTINGS_TABLE = 'app_settings'
/** Storage bucket that holds optional contribution uploads (photo/signature/artwork). */
export const UPLOADS_BUCKET = 'gratitude-uploads'

export type ContributionStatus = 'pending' | 'approved' | 'rejected'

/** Full row as read back by the admin moderation page. */
export interface ContributionRow {
  id: string
  created_at: string
  message: string
  name: string
  email: string
  location: string | null
  attachments: string[]
  status: ContributionStatus
  star_id: number | null
  in_book: boolean
}

/** Read an editable app setting (e.g. 'heyzine_url'). Null if unset/unavailable. */
export async function getSetting(key: string): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select('value')
    .eq('key', key)
    .maybeSingle()
  if (error) return null
  return data?.value ?? null
}

/** Upsert an editable app setting (admin only — enforced by RLS). */
export async function setSetting(key: string, value: string): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Backend not connected.' }
  const { error } = await supabase
    .from(SETTINGS_TABLE)
    .upsert({ key, value, updated_at: new Date().toISOString() })
  return { error: error?.message }
}

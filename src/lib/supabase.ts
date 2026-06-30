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

/** Storage bucket that holds optional contribution uploads (photo/signature/artwork). */
export const UPLOADS_BUCKET = 'gratitude-uploads'

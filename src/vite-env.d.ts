/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL. Safe to expose; access is governed by RLS. */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon/public key. Safe to expose; access is governed by RLS. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

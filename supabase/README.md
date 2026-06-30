# Supabase setup — Book of Gratitude

Three steps connect the contribution form to a real backend. Until they're done,
the form keeps working in local-preview mode.

## 1. Create the project
- Sign in at [supabase.com](https://supabase.com) → **New project**.
- Once it's ready, go to **Project Settings → API** and copy:
  - **Project URL**
  - **anon / public key** (safe to expose — protected by RLS)

## 2. Add the credentials locally
Copy `.env.example` to `.env` in the project root and fill in:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

`.env` is gitignored. On Netlify, add the same two variables under
**Site settings → Environment variables**.

## 3. Create the schema
In the Supabase dashboard → **SQL Editor**, paste and run [`schema.sql`](./schema.sql).
It creates the `gratitude_contributions` table, RLS policies (public can only
*insert pending* messages — never read or approve), and a private uploads bucket.

## Verify
Restart `npm run dev`, submit a test message, and check
**Table Editor → gratitude_contributions** in the dashboard. The success note
changes from the preview text to "Thank you — your message has been received."

## Still to do (separate step)
A confirmation email to the contributor, via **Brevo** sent from a **Supabase
Edge Function** (so the Brevo API key never reaches the browser). Needs a Brevo
API key. Not required for submissions to work.

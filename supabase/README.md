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
It creates the `contributions` table, RLS policies (public can only
*insert pending* messages — never read or approve), and a public uploads bucket.

## Verify
Restart `npm run dev`, submit a test message, and check
**Table Editor → contributions** in the dashboard. The success note
changes from the preview text to "Thank you — your message has been received."

---

# Email notifications (Brevo + Edge Function)

Contributors receive branded emails at three moments, plus one manual batch:

| Trigger                                   | Email        | Sent by            |
| ----------------------------------------- | ------------ | ------------------ |
| Form submission (`INSERT`)                | Message received (+ newsletter opt-in) | Webhook |
| Admin approves (`status → approved`)      | Light confirmed | Webhook         |
| Admin rejects (`status → rejected`)       | Gentle decline  | Webhook         |
| 26 Nov 2026 unveiling                     | Book unveiled   | Manual batch    |

The Brevo API key lives only in the Edge Function (never in the browser). The
function ([`functions/send-email`](./functions/send-email/)) protects itself with
a shared `WEBHOOK_SECRET`, so it does **not** rely on a Supabase JWT.

## 1. Prepare Brevo
- Create a [Brevo](https://www.brevo.com) account.
- **Senders & Domains** → authenticate the sending domain and verify the sender
  `noreply@sacredlightsymphony.org`. Emails will bounce until the domain is
  authenticated (SPF/DKIM). To change the address, edit `SENDER` in
  [`index.ts`](./functions/send-email/index.ts).
- **Contacts → Lists** → create/confirm the newsletter list. Its **ID must equal
  `NEWSLETTER_LIST_ID`** in [`index.ts`](./functions/send-email/index.ts)
  (currently `2`). Update one to match the other.
- **SMTP & API → API Keys** → create a key. This is `BREVO_API_KEY` below.

## 2. Set the function secrets
Choose any strong random string for `WEBHOOK_SECRET` (used again in step 4).

```bash
supabase link --project-ref YOUR-PROJECT-REF     # once per machine
supabase secrets set BREVO_API_KEY=xkeysib-...
supabase secrets set WEBHOOK_SECRET=your-long-random-string
```

## 3. Deploy the function
The function does its own auth via `WEBHOOK_SECRET`, so deploy with JWT
verification **off** — otherwise Supabase's gateway rejects the webhook before it
reaches the code.

```bash
supabase functions deploy send-email --no-verify-jwt
```

Its URL is `https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-email`.

## 4. Wire the database webhook
Dashboard → **Database → Webhooks → Create a new hook**. One hook covers all
three automatic emails — the function decides which to send from the payload.

- **Table:** `contributions`
- **Events:** ✅ Insert  ✅ Update  (leave Delete off)
- **Type:** HTTP Request → **POST**
- **URL:** the function URL from step 3
- **HTTP Headers:**
  - `Content-Type: application/json`
  - `x-webhook-secret: <the same WEBHOOK_SECRET from step 2>`

Supabase sends `{ type, record, old_record }`; the function maps `INSERT →`
received, `approved → light confirmed`, `rejected → decline`, and no-ops on any
other change (e.g. editing a message, featuring it).

## 5. Verify end to end
1. Submit a test message through the form → check the inbox for **received**, and
   (if opted in) confirm the contact appears in the Brevo newsletter list.
2. In the admin dashboard, **approve** it → check for **light confirmed** with the
   right Light Reference (`star_id`).
3. Submit another, **reject** it → check for the **decline** email.
4. Logs: Dashboard → **Edge Functions → send-email → Logs**. Brevo send failures
   are logged there (`Brevo send error …`).

## 6. The unveiling batch (26 Nov 2026)
Email 4 is not webhook-driven — invoke the function once per recipient with a
`manual` field. Loop over approved contributors and POST:

```bash
curl -X POST https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-long-random-string" \
  -d '{ "manual": "unveiling",
        "record": { "email": "person@example.com", "first_name": "Ada", "star_id": 42 } }'
```

> The unveiling template links to `/book` as a placeholder — swap it for the real
> personal Book page (`bookUrl` in [`emails.ts`](./functions/send-email/emails.ts))
> before the batch goes out.

---

# The Homage Portal (`/homage`)

A private, invitation-only page: password gate → release → guide track → upload →
confirmation, plus an optional note for the Living Book of Gratitude. The page is
static and this repo is public, so every lock is enforced by one Edge Function,
[`functions/homage`](./functions/homage/). Its tables and its storage bucket have
**no** public access — only that function (service role) and the Supabase
dashboard can reach them.

> **Skeleton status.** The e-signature step is a placeholder (`HOMAGE_SIGNING_MODE`
> defaults to `stub`): it records who is contributing and unlocks the steps below,
> but it is **not** a signed release. The page shows a "Preview build" strip while
> in this mode. Do not send invitations until a provider is wired in.

Without a `.env` (local dev), the page runs as a local preview: any password
opens it and uploads are simulated, so the whole flow can be walked through.

## 1. Create the tables and bucket
Run [`schema.sql`](./schema.sql) §13 in the **SQL Editor**. It adds
`homage_submissions`, `homage_uploads`, `homage_attempts` and the private bucket
`homage-private`.

## 2. Set the function secrets

```bash
supabase secrets set HOMAGE_SESSION_SECRET=a-long-random-string
supabase secrets set HOMAGE_PASSWORDS=the-invitation-password
```

- **Rotating the password** is just setting `HOMAGE_PASSWORDS` again — no deploy.
- **One password per invitee group:** set it to JSON instead, e.g.
  `{"circle":"…","invitees":"…"}`. The group used is stored with each submission
  as `access_tier`. (Easiest to paste in Dashboard → Edge Functions → Secrets.)
- Optional: `HOMAGE_MAX_UPLOAD_MB` (default `50`, the free-plan per-file limit —
  raise it only after upgrading the plan **and** the project's upload limit in
  Storage settings), `HOMAGE_ALLOWED_ORIGINS` (comma list, e.g. a Netlify deploy
  preview URL; production and `localhost:5173` are always allowed).

## 3. Deploy the function

```bash
supabase functions deploy homage
```

The page calls it with the anon key, so JWT verification can stay **on**.

## 4. Add the guide track
Dashboard → **Storage → homage-private** → create a `guide` folder and upload:
- one audio file to stream (`.mp3`, `.m4a`, `.wav` or `.ogg`)
- one `.zip` — the click-track package to download

The function hands out one-hour links to these, and only after Step 1 is done.

## 5. Where contributions land
- Files: `homage-private/submissions/ArtistName_Submission_YYYY-MM-DD.ext`
  (a second file the same day gets `_2`), and Living Book notes under
  `gratitude/Name_Gratitude_YYYY-MM-DD.ext`.
- Records: **Table Editor →** `homage_submissions` (who, release status) and
  `homage_uploads` (each file or written message).

## 6. Verify end to end
1. Open `/homage`, enter a wrong password → refused; nine wrong tries from one
   address → locked out for fifteen minutes.
2. Enter the right one → Steps 2–3 are greyed out until Step 1 is completed.
3. Complete Step 1 → the guide track plays and the package downloads.
4. Upload a small file → progress reaches 100%, Step 4 confirms, the file
   appears in the bucket under its new name, and a row appears in `homage_uploads`.
5. Leave a written Living Book message → a `gratitude_message` row appears.

## Not built yet
- E-signature (DocuSign / Dropbox Sign / PandaDoc) and its webhook.
- Resumable uploads for multi-gigabyte video (needs the paid plan).
- An admin page for the named staff, deletion requests and the retention job.

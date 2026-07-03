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

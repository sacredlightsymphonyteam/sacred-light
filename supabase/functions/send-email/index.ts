// Supabase Edge Function: send-email
//
// Invoked by Supabase Database Webhooks on the `contributions` table:
//   - INSERT                         → Email 1 (message received) + newsletter opt-in
//   - UPDATE status → 'approved'     → Email 2 (light confirmed)
//   - UPDATE status → 'rejected'     → Email 3 (gentle decline)
// Email 4 (Nov 26 unveiling) is a batch — invoke this function with
//   { "manual": "unveiling", "record": { ...contribution row... } } per recipient.
//
// Secrets (set with `supabase secrets set`):
//   BREVO_API_KEY   — Brevo REST API key (never expose to the browser)
//   WEBHOOK_SECRET  — shared secret; the webhook must send it as x-webhook-secret

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { buildEmail } from './emails.ts'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') ?? ''
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') ?? ''
const SENDER = { name: 'Sacred Light Symphony', email: 'noreply@sacredlightsymphony.org' }
const NEWSLETTER_LIST_ID = 2

type Rec = Record<string, unknown>

async function sendEmail(to: string, toName: string, subject: string, htmlContent: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender: SENDER, to: [{ email: to, name: toName }], subject, htmlContent }),
  })
  if (!res.ok) console.error('Brevo send error', res.status, await res.text())
  return res.ok
}

async function addToNewsletter(email: string, firstName: string, lastName: string) {
  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      email,
      attributes: { FIRSTNAME: firstName, LASTNAME: lastName },
      listIds: [NEWSLETTER_LIST_ID],
      updateEnabled: true,
    }),
  })
  // 201 created, 204 updated — anything else is an error worth logging
  if (!res.ok && res.status !== 204) console.error('Brevo contact error', res.status, await res.text())
}

function pickEmail(payload: Record<string, unknown>): string | null {
  if (typeof payload.manual === 'string') return payload.manual // batch/manual (e.g. "unveiling")
  const type = payload.type
  const record = payload.record as Rec | undefined
  const oldRecord = payload.old_record as Rec | undefined
  if (type === 'INSERT') return 'received'
  if (type === 'UPDATE' && record) {
    if (record.status === 'approved' && oldRecord?.status !== 'approved') return 'approved'
    if (record.status === 'rejected' && oldRecord?.status !== 'rejected') return 'declined'
  }
  return null
}

serve(async (req) => {
  if (WEBHOOK_SECRET && req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return new Response('unauthorized', { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return new Response('bad request', { status: 400 })
  }

  const record = (payload.record ?? {}) as Rec
  const email = String(record.email ?? '')
  const which = pickEmail(payload)

  if (!which || !email) return new Response('no-op', { status: 200 })

  try {
    if (which === 'received' && record.newsletter_opt_in) {
      await addToNewsletter(
        email,
        String(record.first_name ?? record.name ?? ''),
        String(record.last_name ?? ''),
      )
    }
    const { subject, html } = buildEmail(which, record)
    await sendEmail(email, String(record.first_name ?? record.name ?? ''), subject, html)
  } catch (e) {
    console.error('send-email error', e)
    return new Response('error', { status: 500 })
  }

  return new Response('ok', { status: 200 })
})

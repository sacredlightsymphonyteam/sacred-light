# Sacred Light Symphony — Handoff Checklist

How to hand the project over to the client (SLS / Marie) as the true owner of
all assets. Work top to bottom; do the **ownership transfers together at final
handoff** so the client ends up owning everything at once. Keep backups first.

Current locations (as of handoff prep):
- **Repo:** `github.com/zzamisj/sacred-light` (Jomer's personal account)
- **Hosting:** Netlify, site name `sacred-light` (staging: `d-light.netlify.app`)
- **Backend:** Supabase project ref `vtbslkgbhgbriezwclxl` (Jomer's account = staging)
- **Domain:** `sacredlightsymphony.com` (decided; registration owner TBD)

---

## 1. Ownership transfer (the big ones)
- [ ] **Domain** — register `sacredlightsymphony.com` under the **client** (see §A).
- [ ] **Supabase** — transfer the project to a client-owned org (see §B). *Holds the public's personal data → client must own it (GDPR).*
- [ ] **GitHub repo** — transfer to the client's account/org (see §C).
- [ ] **Netlify** — transfer the site to the client's team, or have them relink the repo.

## 2. Credentials & secrets
- [ ] **Rotate the Supabase DB password** (was shared during dev).
- [ ] Hand over securely (password manager): Supabase URL + keys, Netlify login, domain registrar login, Brevo API key, video-platform login.
- [x] No secrets in git — only `.env.example` is tracked; `.env` is gitignored.

## 3. Backend (Supabase)
- [x] Schema + RLS + grants run in the live project.
- [ ] **Admin users** created in Authentication → Users (add Marie; confirm login at `/admin/login`).
- [ ] **Delete test rows** from `contributions`.
- [ ] Drop the orphaned old `gratitude_contributions` table.
- [ ] Take a **DB backup** before transfer (SQL dump).

## 4. Hosting & deploy config
- [x] `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` set on Netlify (all deploy contexts).
- [x] `SITE_URL` = `https://sacredlightsymphony.com` in `src/lib/site.ts`.
- [ ] Merge `fold1-tweaks` → `main` (design refinements) before handoff.
- [ ] Decide **password protection** (paid Netlify feature) — keep for staging vs. open at launch.
- [ ] Add the custom domain in Netlify + confirm auto-SSL.

## 5. Third-party integrations
- [ ] **Brevo** — account + API key → deploy the confirmation-email Edge Function (prototype has `send-confirmation` in `C:\sacred light`).
- [ ] **Video** — resolve **Vimeo vs YouTube** (code currently wired for Vimeo); set the final film in `Hero.tsx`.
- [ ] **Heyzine** flipbook — account, when the Book export is built.

## 6. Content & assets (from Marie)
- [ ] Final **hero video** · **"Tina in Blue"** image · final **hero artwork**.
- [ ] Live **"thank-you" copy** for the contribution form (current text is a placeholder).
- [ ] **Design approval** — everything is still subject to her review.

## 7. Client enablement
- [ ] Walk Marie through the **moderation page** (`/admin`): log in, approve/reject, "add to book."
- [ ] Confirm she can reset her own admin password.

## 8. Documentation
- [ ] Add a **README / setup guide** to the repo (adapt the prototype's `DOCUMENTATION.md` + `SETUP-GUIDE.md`).
- [ ] Document: deploy process, env vars, adding an admin, how moderation works, the data model.

## 9. Outstanding build (scope to agree)
- [ ] **Sections 3 & 4** (Living Constellation, The Unveiling).
- [ ] `robots.txt` + `sitemap.xml`.
- [ ] Phase 2: Personal Star URLs, featured messages, newsletter.
- [ ] Tina's Gift page (deferred — needs content).

---

# Transfer procedures

## §A — Domain
Cleanest: **the client registers it under their own account** → no transfer ever needed; just point DNS at Netlify (they add records or delegate). SEO/canonical already targets `.com`.

If Jomer registers it first (to move faster):
- Use the **same registrar the client will use**, so handover is a simple **account "push"** (instant, no lock).
- ⚠️ A newly-registered domain is locked by ICANN against **cross-registrar** transfers for **60 days** (same-registrar account pushes are exempt).

## §B — Supabase (project transfer keeps URL/keys/data intact)
1. Client creates a **Supabase organization** (their account).
2. Client **invites Jomer to that org as Owner** (needed to move a project in).
3. Project → **Settings → General → Transfer project** → select the client's org → confirm.
4. Same project ref, URL, anon key, data, auth users, storage — **Netlify env vars don't change; the app keeps working.**
5. Billing moves to the client's org (add payment method if a paid plan is needed).
6. Client may remove Jomer from the org later.
- Check plan compatibility (paid features need a paid target org). Fallback if blocked: recreate under the client's org and migrate (pg_dump/restore, re-upload storage, recreate admin user, update URL/keys).

## §C — GitHub repo
1. Recipient needs a GitHub account or a client org.
2. Repo → **Settings → Danger Zone → Transfer** → type repo name → enter new owner → confirm.
3. New owner **accepts** the transfer.
4. After transfer:
   - Update local remote: `git remote set-url origin https://github.com/NEW-OWNER/sacred-light.git`
   - **Reconnect Netlify** to the new repo location (Site config → Build & deploy → link repository).
   - Re-add Jomer as **admin/collaborator** for any support period.
- On a *personal* repo, an Admin collaborator cannot remove the owner; once ownership is transferred, the new owner controls access.

## §D — Netlify
- Transfer the site to the client's Netlify **team**, or have the client create the site linked to the (transferred) repo.
- Re-add the two `VITE_SUPABASE_*` env vars if the site is recreated.
- Re-add the custom domain + SSL.

---

## Suggested order at final handoff
1. Merge `fold1-tweaks` → `main`; confirm staging looks right.
2. Take backups: **clone the repo**, **DB dump** from Supabase.
3. Rotate the Supabase DB password; delete test rows.
4. Client sets up their **Supabase org**, **GitHub org/account**, **Netlify team**, **domain**.
5. Transfer: Supabase → GitHub → Netlify relink → domain push/DNS.
6. Verify end-to-end on the client-owned stack; re-add Jomer as admin for support.

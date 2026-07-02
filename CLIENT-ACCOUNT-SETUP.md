# Sacred Light Symphony — Client Account Setup Guide

A step-by-step guide for the client (Sacred Light Symphony / Marie) to create
the accounts that will **own** the project. Once these exist, Jomer transfers
everything across so the client owns the domain, code, database and email.

You do **not** need to be technical — each service is a normal sign-up. Where a
step needs Jomer, it says so, and what to send him.

Work through them in any order. When done, tell Jomer and he'll do the transfers.

---

## 1. Supabase (the database — holds the Book of Gratitude messages)

Why: this stores every contribution (names, messages, emails). It must be owned
by SLS for data-protection (GDPR) reasons.

1. Go to **https://supabase.com** → **Start your project** → sign up
   (email, or "Continue with GitHub" once you have a GitHub account from step 2).
2. When asked, **create an Organization** — name it e.g. `Sacred Light Symphony`.
   Choose the **Free** plan to start (can upgrade later).
3. You do **not** need to create a project — Jomer will move the existing one in.
4. Invite Jomer so he can transfer it: **Organization → Team → Invite** →
   enter Jomer's email → role **Owner**.
5. **Send Jomer:** confirmation that the org exists + that he's been invited.

---

## 2. GitHub (the website's code)

Why: the source code of the site lives here.

1. Go to **https://github.com** → **Sign up** (personal account is fine).
   *(Optional: create an Organization for SLS — Settings aren't required; a
   personal account works.)*
2. Verify your email.
3. **Send Jomer:** your GitHub **username** (and org name if you made one).
   He'll transfer the repository to you; you'll get an email to **Accept** it.

---

## 3. Netlify (the web host — serves the live site)

Why: this builds and publishes the website, and connects the domain.

1. Go to **https://www.netlify.com** → **Sign up**.
   Easiest: **"Sign up with GitHub"** (uses the account from step 2).
2. When prompted to create a **Team**, name it e.g. `Sacred Light Symphony`.
   The **Free** plan covers a custom domain + SSL (no paid plan needed).
3. Nothing else to configure — Jomer connects the site to your repo.
4. **Send Jomer:** the **team name** (or invite him: Team → Members → Invite).

---

## 4. Domain (sacredlightsymphony.com)

Why: the public web address. Cleanest if **you** register it under your own
account, so it never has to be transferred.

1. Go to a reputable registrar — e.g. **https://www.namecheap.com**,
   **https://porkbun.com**, or **https://domains.google** (or your preferred one).
2. Search for **sacredlightsymphony.com** and complete the purchase
   (~USD 10–15 / year). Turn on **auto-renew** and **WHOIS privacy** if offered.
3. Keep the registrar login safe (password manager).
4. **Send Jomer:** which registrar you used + confirmation it's registered.
   He'll give you the two or three DNS records to point it at Netlify
   (or you can grant him temporary access to set them).

> Tip: use the **same registrar** you intend to keep it with — avoids a 60-day
> ICANN lock that applies to moving a brand-new domain between registrars.

---

## 5. Brevo (sends the emails + newsletter)

Why: sends the automated emails (message received, approved, etc.) and the
newsletter. Nothing goes out until this exists.

1. Go to **https://www.brevo.com** → **Sign up free**.
2. Complete the profile (company: Sacred Light Symphony).
3. **Verify a sender**: Settings → **Senders, Domains & Dedicated IPs** →
   add and verify the sending address (e.g. `sacredlightsymphony@protonmail.com`,
   or a `@sacredlightsymphony.com` address once the domain is set up).
4. Create an **API key**: Settings → **SMTP & API** → **API Keys** →
   **Generate a new API key** → name it `website`.
5. **Send Jomer (securely — not by plain email):** the **API key** and the
   **verified sender address**. Use a password manager share or a secure note.

---

## What to send Jomer, in short
- **Supabase:** org created + he's invited as Owner
- **GitHub:** your username (+ org, if any)
- **Netlify:** team name (or an invite)
- **Domain:** registrar used + that it's registered
- **Brevo:** API key + verified sender (shared securely)

Once these are in, Jomer moves the project onto your accounts and confirms the
whole site works end-to-end on your own stack. Keep every login in a password
manager.

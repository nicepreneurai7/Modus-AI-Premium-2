# Modus AI — Instagram Caption Generator

## Current Live Setup (as of this zip)

- **Frontend:** Static HTML/Tailwind/vanilla JS
- **Live URL:** https://modus-ai-app-nicepreneur.vercel.app (deployed directly via Vercel API — do NOT create a new Vercel project; this one is permanent)
- **Backend:** Supabase project `ctflykqdlribkpdsqccs`
- **Edge Function:** `hyper-worker` (already deployed on Supabase, do not need to redeploy unless code changes)
- **AI Provider:** Groq (`llama-3.3-70b-versatile`) — switched from Gemini due to a Google Cloud billing/quota issue
- **Billing:** Paddle (production)

## Database schema (actual, as currently live)

### profiles
- id (uuid, references auth.users)
- email, role, role_custom, niche, niche_custom
- onboarded (boolean)
- theme_preference
- subscription_status ("free" | "paid")
- generations_used_this_month (int, default 0)
- generation_reset_at (date)
- paddle_subscription_id, paddle_customer_id
- created_at

### history
- id (uuid)
- user_id (references auth.users)
- title, topic
- output_types (text[])
- tone, length, formatting
- result (jsonb) — contains { hooks: string[], captions: string[], hashtags: string[] }
- created_at

**Important:** history stores hooks/captions/hashtags together in a single `result` jsonb
column, NOT as separate columns. The frontend code (dashboard.js, history.js) is written
to match this.

## Edge Functions on Supabase

1. **hyper-worker** — main AI generation proxy. Verifies the user's Supabase JWT,
   validates the request payload, calls Groq, parses the JSON response, returns it.
   `GROQ_API_KEY` is stored as a Supabase secret and never exposed to the frontend.

2. **Paddle-Webhook** — handles Paddle payment webhooks, updates `subscription_status`
   to "paid" on successful checkout.

## Making future changes

Since deployment happens directly via Claude's Vercel connector (not zip upload,
not GitHub), to update the live site: give Claude the new file contents and ask
it to redeploy to the same Vercel project (`modus-ai-app`). This keeps the same
permanent URL every time — no new project is created.

To update the Edge Function: give Claude the new code and ask it to redeploy
`hyper-worker` on Supabase project `ctflykqdlribkpdsqccs`.

## Known non-critical items

- Legal pages (terms.html, privacy.html, refund.html) exist in earlier versions
  of this project but were not included in the most recent Vercel deployment.
  Add them back before a public launch.

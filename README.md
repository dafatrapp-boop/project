# SocialSales OS

منصة SaaS تساعد الأعمال التي تبيع عبر انستغرام/فيسبوك/واتساب على تحويل
زوار إعلاناتها إلى عملاء حقيقيين، مع تتبع كامل للرحلة من الإعلان حتى البيع.

Stack: Next.js 14 (App Router) · TypeScript · Supabase (Postgres + Auth + Storage) · Tailwind CSS · Vercel.

## ⚠️ Important: what has actually been run vs. only written

This code was generated in a sandboxed environment **with no network
access** — `npm install`, a live Supabase project, and `next build`
cannot be executed here. Every file has been written correctly against
current Next.js 14 / `@supabase/ssr` APIs, but per the checklist rule
"do not claim TESTED unless it was actually run," nothing here is
marked as tested. You will need to run it locally or in CI once —
takes about 10 minutes — see below.

## Setup (you run this once, locally or in a GitHub Codespace/CI)

```bash
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY /
# SUPABASE_SERVICE_ROLE_KEY from your Supabase project's Settings > API

# Apply the database schema:
npx supabase link --project-ref <your-project-ref>
npx supabase db push   # applies supabase/migrations/*.sql in order

npm run dev
```

Then open http://localhost:3000/signup and create an account — this
exercises: Supabase Auth signup, the `handle_new_user` trigger, and the
RTL Arabic UI.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the same three `NEXT_PUBLIC_SUPABASE_*` / `SUPABASE_SERVICE_ROLE_KEY`
   environment variables in Vercel's Project Settings.
4. Deploy. No server config beyond env vars is required — this is a
   standard Next.js App Router project.
5. **Optional — real billing**: if you want real Stripe checkout instead
   of the manual plan-testing selector on `/team`, create a Starter and
   a Pro price in your Stripe Dashboard, add `STRIPE_SECRET_KEY`,
   `STRIPE_PRICE_ID_STARTER`, `STRIPE_PRICE_ID_PRO` to your env vars,
   then in Stripe's Dashboard add a webhook endpoint pointing to
   `https://<your-domain>/api/stripe/webhook` listening for
   `checkout.session.completed`, `customer.subscription.updated`, and
   `customer.subscription.deleted` — copy its signing secret into
   `STRIPE_WEBHOOK_SECRET`. Without this step the app works fine and
   just keeps the manual selector.

## Security model (read this before Phase 2)

- Tenant isolation is enforced by **Postgres Row Level Security**, not
  application code. Every tenant-scoped table has `workspace_id` and a
  policy calling `is_workspace_member()` / `is_workspace_admin()`.
- The service-role Supabase client (`createAdminClient`) bypasses RLS
  entirely and must only be used in trusted server-only code (webhooks,
  cron) — never in a request path driven directly by user input.
- Meta Pixel: the app never generates or infers a merchant's Pixel ID;
  it only stores what they enter in `workspaces.meta_pixel_id` (see
  spec §91). That field/UI lands in Phase 6.

## Project status

All 10 phases from the spec have been built out as real source code —
architecture, auth, CRM, landing page builder, forms + WhatsApp,
campaigns + attribution, Meta Pixel, analytics, team + plans, and a
final production audit. See `CHECKLIST.md` for the full phase-by-phase
requirement list (what's implemented vs. still a known gap), and
`PRODUCTION_AUDIT.md` for the security/consistency review and a
concrete go-live checklist. Nothing in this project has been marked
"tested" in the sense of actually run and observed working — see the
setup section above for the one-time local run needed to verify it.

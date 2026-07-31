# Production Audit — SocialSales OS

This is a manual code-review audit (no live database or npm install was
available in the build environment — see README). It checks
consistency, security posture, and completeness across all 10
migrations and the full application, not just what Phase 10 itself added.

## What was checked

1. **RLS coverage** — every table created across all 9 migrations was
   cross-checked against `enable row level security` statements.
   Result: **12/12 tables have RLS enabled, zero gaps.**

2. **Policy completeness per table** — reviewed each table's policy set
   against what the app actually does to it (select/insert/update/delete).
   Two tables intentionally have no INSERT policy for direct client
   access — `lead_activities` and `form_submission_log` — because both
   are written exclusively by `SECURITY DEFINER` trigger/RPC functions,
   which is by design, not an oversight (documented inline in the
   migrations where each was introduced).

3. **SECURITY DEFINER function exposure** — checked every function
   against its grants. Found and fixed one real gap: `is_workspace_member()`
   and `is_workspace_admin()` (from Phase 1) were left at Postgres's
   default grant (EXECUTE to PUBLIC), making them directly callable as
   RPC endpoints by anyone. Impact was low (they only return a boolean,
   no data leak), but fixed anyway in `0010_production_audit_hardening.sql`
   for defense-in-depth. Every other SECURITY DEFINER function either
   already had explicit `revoke`/`grant`, or is a trigger function that
   Postgres refuses to call outside an actual trigger firing regardless
   of grants.

4. **Workspace-scoping consistency in server actions** — every mutating
   server action was checked for an explicit `.eq('workspace_id', ...)`
   filter (defense-in-depth on top of RLS, the project's established
   pattern). Found and fixed one inconsistency: `completeFollowUpAction`
   relied on RLS alone without the explicit filter. Not an actual
   security hole (RLS still enforced it correctly) but fixed for
   consistency with the rest of the codebase.

5. **Env var consistency** — every `process.env.*` reference in the
   codebase has a corresponding entry in `.env.example`, and nothing in
   `.env.example` is a phantom var for a feature that doesn't exist.

6. **No leftover TODO/FIXME/placeholder markers** anywhere in the
   codebase.

7. **`createAdminClient()` (service role key) is defined but never
   called anywhere.** This is intentional — it exists as scaffolding for
   future trusted server-only code (Stripe webhooks, scheduled jobs),
   none of which exist yet. Not a bug; flagging so it isn't mistaken for
   dead code that should be removed.

8. **Migration ordering** — all 10 migrations apply cleanly in sequence;
   later migrations that alter/extend earlier tables (e.g. 0005 adding
   the FK Phase 1 left open, 0008 adding `workspaces.plan`, 0010
   tightening 0001's grants) only ever reference objects created in an
   earlier-numbered file.

## What this audit does NOT cover (and why)

- **No actual query execution, load testing, or migration dry-run** —
  the build sandbox has no network access, so nothing here has touched
  a real Postgres instance. This audit is static/manual review, not a
  substitute for running the migrations against a real Supabase project
  before going live.
- **No dependency vulnerability scan** (`npm audit`) — requires
  `npm install`, which requires network access this sandbox doesn't have.
- **No automated tests exist to run** — see Phase 9 notes; this remains
  the single biggest gap in this project as delivered.

## Go-live checklist (do this before real users touch it)

1. `npm install` locally, `npm run typecheck` and `npm run build` —
   confirm zero TypeScript/build errors (there SHOULD be none based on
   this review, but this has never actually been compiled).
2. Create a Supabase project, run `npx supabase db push` to apply all
   10 migrations in order, then `npx supabase gen types typescript
   --linked > types/database.ts` to replace the hand-written types with
   the real generated ones (the hand-written version should match, but
   let the source of truth be the actual schema going forward).
3. `npm audit` and update any flagged dependencies.
4. Manually exercise, end to end, in a real browser: signup → email
   verification → workspace creation → create+publish a landing page →
   submit its form as a visitor → confirm the lead appears in the CRM →
   create a campaign and confirm attribution → invite a second
   team member and accept the invite → check analytics render.
5. Set real environment variables in Vercel (see `.env.example`).
6. Decide on and configure: an email provider (for real invitation
   emails — currently link-only), Stripe (for real billing — currently
   a manual test-only plan switcher), and an error-monitoring service.
7. Add a CAPTCHA/Turnstile to the public lead form before real ad
   traffic hits it — current bot defense (rate limit + honeypot) is
   real but lightweight.
8. Write at least a smoke-test suite before considering this
   production-hardened — none exists today.

See `CHECKLIST.md` for the full phase-by-phase requirement list and
`README.md` for local setup and deployment steps.

## Re-audit round (after adding image uploads)

Requested explicitly: re-check the whole source after adding the image
upload feature, not just the new files. Ran the following checks
against the entire codebase:

- **Migration sequence**: all 11 migrations (0001-0011) numerically
  sequential, no gaps, each references only objects from earlier files.
- **Storage security**: found the same class of gap as the earlier RLS
  audit — client-side-only file size/type checks can be bypassed by a
  modified request. Fixed by setting `file_size_limit` and
  `allowed_mime_types` directly on the Storage bucket (server-side,
  unbypassable), not just in the browser upload helper.
- **Orphaned file cleanup**: initially, removing or replacing an image
  in the editor only cleared the database field and left the file in
  Storage forever. Fixed — both remove and replace now actually call
  Storage's delete on the old file.
- **`any`/`@ts-ignore` scan**: zero occurrences anywhere in the codebase.
- **Import resolution**: every `@/...` import (30 unique) and every
  relative (`./`, `../`) import across the whole `app/` directory
  resolves to a real file — zero broken imports.
- **`'use server'` / `'use client'` directive check**: every
  `actions.ts` file has `'use server'`; every component using React
  hooks (`useState`, `useEffect`, `useTransition`, `useRouter`, etc.)
  has `'use client'`. Zero missing.

No other gaps were found in this round beyond the two listed above,
both of which are now fixed.

## Third audit round (after the Kanban/notifications/Stripe feature batch)

Requested explicitly again: re-check the whole source, not just the new
files, after adding tags, activity log, notifications, global search,
Kanban pipeline, CSV import, Excel export, duplicate detection,
duplicate-page, auto-template-on-signup, funnel chart, executive
dashboard, and Stripe billing.

- **Found and fixed a real vulnerability**, not just an inconsistency
  this time: `log_workspace_activity()` and `notify_workspace_members()`
  are internal helper functions that take a raw `workspace_id`
  parameter with no membership check inside them. That's safe only
  because they're meant to be called exclusively from other
  `SECURITY DEFINER` trigger functions — but both were initially left
  at Postgres's default grant (EXECUTE to PUBLIC on function creation),
  making them directly callable via RPC by any authenticated user.
  Left unfixed, this would have let anyone forge fake audit-log entries
  or send phishing-style notifications (fake title, fake link) into
  **any** workspace, not just their own — a materially worse issue than
  the boolean-leak found in the first audit round. Fixed by revoking
  PUBLIC execute with no grant to any role; internal calls from the
  trigger functions still work correctly (a SECURITY DEFINER function's
  nested calls run under its own owner's privileges, independent of the
  outer caller's grants).
- Re-ran the full audit battery (RLS coverage across all 14 tables now,
  explicit-grant check across all 11 sensitive functions now, `any`/
  `@ts-ignore` scan, import resolution, `'use server'`/`'use client'`
  directive check) against the ENTIRE project, not just this batch —
  all pass with zero remaining gaps.
- Verified Stripe integration doesn't silently fail: every route
  (`checkout`, `portal`, `webhook`) explicitly checks for
  `getStripeClient() === null` / missing webhook secret and returns a
  clear 501 rather than throwing, so a deployment without Stripe
  configured keeps working exactly as before (manual plan selector on
  `/team`) instead of crashing those endpoints.
- `createAdminClient()` (service role client) is no longer dead code —
  it's now genuinely used by the Stripe webhook handler, which is
  correct: a webhook has no user session for RLS to key off of, so it
  needs the service-role bypass, with Stripe's signature verification
  as the actual trust boundary instead.



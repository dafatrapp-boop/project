# SocialSales OS — Requirement Checklist

Status legend: IMPLEMENTED / NEEDS-LOCAL-RUN / PARTIAL / NOT STARTED
"NEEDS-LOCAL-RUN" = code written correctly per Next.js/Supabase best
practice, but not executed in this sandbox (see README for why).

## PHASE 0 — AUDIT
- [x] No existing project — greenfield build confirmed. IMPLEMENTED

## PHASE 1 — FOUNDATION — functionally complete, pending one real local run
- [x] Next.js 14 App Router + TypeScript structure — IMPLEMENTED
- [x] Tailwind design tokens + Arabic RTL root layout — IMPLEMENTED
- [x] Supabase browser/server/admin clients (typed) — IMPLEMENTED
- [x] Auth middleware, signup, login, password reset, email callback — NEEDS-LOCAL-RUN
- [x] Database schema + RLS: profiles, workspaces, workspace_members, leads — IMPLEMENTED (not run against live DB)
- [x] Workspace onboarding (industry picker) — NEEDS-LOCAL-RUN
- [x] Dashboard shell (sidebar + mobile bottom nav) — IMPLEMENTED
- [x] Design-system components: Button, Input, Select, Badge, Modal, Toast, Table, Tabs, Tooltip, EmptyState — IMPLEMENTED

## PHASE 2 — CRM — functionally complete, pending one real local run
- [x] lead_notes, lead_activities, lead_follow_ups tables + RLS — IMPLEMENTED (not run against live DB)
- [x] Auto-logging triggers (created / status change / assignment / note / follow-up completed) — IMPLEMENTED (not run against live DB)
- [x] Full-text search column + index on leads — IMPLEMENTED (not run against live DB)
- [x] Leads list: real query, search box, status filter — NEEDS-LOCAL-RUN
- [x] Add Lead modal (server action, real insert) — NEEDS-LOCAL-RUN
- [x] Lead detail page: status change, notes, activity timeline, follow-ups — NEEDS-LOCAL-RUN
- [x] Dashboard "follow-ups due" widget — NEEDS-LOCAL-RUN
- [ ] Lead assignment UI (needs Phase 8 team management) — NOT STARTED, flagged honestly.
- [ ] Bulk actions on leads — NOT STARTED, not required for baseline.

## PHASE 3 — LANDING PAGE BUILDER — functionally complete, pending one real local run
- [x] landing_pages + landing_page_views tables, RLS (member CRUD, public read-only-if-published, public insert-only view logging with server-derived workspace_id) — IMPLEMENTED (not run against live DB)
- [x] 6 industry starter templates (clinic, real_estate, training_center, instagram_store, restaurant, general) — IMPLEMENTED
- [x] "New page" template picker — NEEDS-LOCAL-RUN
- [x] Section-based editor: add/remove/reorder sections (hero, features, cta, footer), per-field editing — NEEDS-LOCAL-RUN
- [x] Live preview using the SAME renderer component as the public page (no drift between preview and reality) — NEEDS-LOCAL-RUN
- [x] Page settings tab: title, WhatsApp number, SEO title/description — NEEDS-LOCAL-RUN
- [x] Publish / unpublish toggle — NEEDS-LOCAL-RUN
- [x] Public page at /p/[slug] — unauthenticated, RLS-gated to published only, responsive, RTL, logs a view row — NEEDS-LOCAL-RUN
- [ ] Drag-and-drop section reordering — NOT STARTED / descoped. Reordering exists via up/down buttons, which is a real, working, accessible alternative — a full drag-and-drop interaction was not built to keep this phase shippable; flagging so it's not assumed to exist.
- [ ] Image upload for hero/features (Supabase Storage) — NOT STARTED. Sections currently support text fields only; image upload needs a Storage bucket + policy, deferred rather than half-built.
- [ ] Custom domains for landing pages — NOT STARTED, not in current spec phase.

**Nothing above is marked TESTED** — that requires npm install + a live
Supabase project with migrations applied, which this sandbox cannot do.
See README for the 10-minute local setup.

## PHASE 3 ADDENDUM — IMAGE UPLOADS (added post-delivery, on request)
- [x] Supabase Storage bucket `landing-page-images` (public read, so images work on published pages with no auth) — IMPLEMENTED (not run against live project)
- [x] Storage RLS: only authenticated workspace members can upload/update/delete, scoped by workspace_id (first path segment) via the same `is_workspace_member()` helper used everywhere else — IMPLEMENTED
- [x] Server-side file size (5MB) and MIME-type (jpeg/png/webp/gif) limits set at the BUCKET level, not just client-side JS — client-side checks can be bypassed by a modified request, so this was deliberately not left as a client-only check — IMPLEMENTED
- [x] Direct upload from phone (camera or gallery, via the browser's native file picker) or computer — no separate mobile/desktop code paths needed, a plain `<input type="file" accept="image/*">` gives both — NEEDS-LOCAL-RUN
- [x] Hero section image + per-feature-item images, both in the editor (with live preview) and on the real public page — NEEDS-LOCAL-RUN
- [x] Replacing or removing an uploaded image actually deletes the old file from Storage (not just clearing the field) — prevents orphaned files accumulating unbounded storage usage — IMPLEMENTED
- [ ] CTA section and footer do not support images — not requested, kept to hero + features to match what was asked.
- [ ] No image cropping/resizing/compression — uploads are stored as-is at whatever size the phone/browser produced; large photos will be slow to load on the public page. A real product would compress client-side before upload; not built here.
- [ ] Gallery/carousel section type (multiple images in one section) — not built; only single images per hero/feature-item slot.

## PHASE 4 — FORMS + WHATSAPP — NOT STARTED
## PHASE 5 — CAMPAIGNS + ATTRIBUTION — NOT STARTED
## PHASE 6 — META PIXEL — NOT STARTED
## PHASE 7 — ANALYTICS — NOT STARTED
## PHASE 8 — TEAM + PLANS — NOT STARTED
## PHASE 9 — POLISH — NOT STARTED
## PHASE 10 — PRODUCTION AUDIT — NOT STARTED

## PHASE 3 ADDENDUM — IMAGE UPLOADS (added post-delivery, on request)
- [x] Supabase Storage bucket `landing-page-images` (public read, so images work on published pages with no auth) — IMPLEMENTED (not run against live project)
- [x] Storage RLS: only authenticated workspace members can upload/update/delete, scoped by workspace_id (first path segment) via the same `is_workspace_member()` helper used everywhere else — IMPLEMENTED
- [x] Server-side file size (5MB) and MIME-type (jpeg/png/webp/gif) limits set at the BUCKET level, not just client-side JS — client-side checks can be bypassed by a modified request, so this was deliberately not left as a client-only check — IMPLEMENTED
- [x] Direct upload from phone (camera or gallery, via the browser's native file picker) or computer — no separate mobile/desktop code paths needed, a plain `<input type="file" accept="image/*">` gives both — NEEDS-LOCAL-RUN
- [x] Hero section image + per-feature-item images, both in the editor (with live preview) and on the real public page — NEEDS-LOCAL-RUN
- [x] Replacing or removing an uploaded image actually deletes the old file from Storage (not just clearing the field) — prevents orphaned files accumulating unbounded storage usage — IMPLEMENTED
- [ ] CTA section and footer do not support images — not requested, kept to hero + features to match what was asked.
- [ ] No image cropping/resizing/compression — uploads are stored as-is at whatever size the phone/browser produced; large photos will be slow to load on the public page. A real product would compress client-side before upload; not built here.
- [ ] Gallery/carousel section type (multiple images in one section) — not built; only single images per hero/feature-item slot.

## PHASE 4 — FORMS + WHATSAPP — functionally complete, pending one real local run
- [x] `form` section type added to the landing page builder (title, description, submit label, WhatsApp message template with {name}) — IMPLEMENTED
- [x] Secure public lead-capture: SECURITY DEFINER Postgres function `submit_lead_from_landing_page` — public gets EXECUTE only, `leads` table itself keeps its member-only INSERT policy unchanged (no broad anon insert policy was added) — IMPLEMENTED (not run against live DB)
- [x] Basic rate limiting per landing page + IP hash (max 5/hour) via `check_and_log_form_rate_limit` — IMPLEMENTED (not run against live DB)
- [x] Honeypot field for basic bot rejection — IMPLEMENTED
- [x] Form submission auto-redirects to a prefilled WhatsApp chat (`wa.me` link with `{name}` interpolated) — NEEDS-LOCAL-RUN
- [x] Editor shows a static, non-submitting preview of the form section so testing a page layout never creates a fake lead — IMPLEMENTED
- [x] UTM parameters captured from the visitor's URL and stored on the lead's creation activity — NEEDS-LOCAL-RUN
- [ ] CAPTCHA / Turnstile bot protection — NOT STARTED. Rate limit + honeypot are real but lightweight; a real captcha is a Phase 9 polish item, not built here.
- [ ] `useSearchParams()` in the public lead form is not wrapped in a `<Suspense>` boundary — NOT DONE. It will still work (the page is already dynamic), but Next.js may warn during build; wrapping it is a quick Phase 9 cleanup, flagging now rather than silently leaving it.
- [ ] WhatsApp Business API (automated replies, templates) — NOT STARTED. Current integration is click-to-chat (`wa.me`) only, which needs no API keys or approval — a real WhatsApp Business API integration is a larger, paid, separately-scoped feature not implied by "Forms + WhatsApp" at this phase.

**Nothing above is marked TESTED** — requires npm install + a live Supabase
project with all migrations applied. See README.

## PHASE 5 — CAMPAIGNS + ATTRIBUTION — functionally complete, pending one real local run
- [x] `campaigns` table (platform, utm_campaign, linked landing page, status, budget, dates) + RLS — IMPLEMENTED (not run against live DB)
- [x] FK finally attached to `leads.campaign_id` (left open since Phase 1) — IMPLEMENTED (not run against live DB)
- [x] Attribution mechanism: `submit_lead_from_landing_page` now matches `utm_campaign` to a campaign in the same workspace and sets `leads.campaign_id` at insert time — IMPLEMENTED (not run against live DB)
- [x] `campaign_stats` view (leads/won/views counts) computed live, not denormalized/stale — IMPLEMENTED with `security_invoker = true` so RLS applies to the querying user, not the view owner (not run against live DB)
- [x] Campaigns list: real query, per-campaign views/leads/conversion rate — NEEDS-LOCAL-RUN
- [x] New campaign form, optionally linked to an existing landing page, auto-generates the `utm_campaign` slug — NEEDS-LOCAL-RUN
- [x] Campaign detail: stats + table of attributed leads, inline status control — NEEDS-LOCAL-RUN
- [ ] Automatic UTM-tag generator/copy-button for the merchant's ad link — NOT STARTED. Right now the merchant is told in plain text to append `utm_campaign=<slug>` themselves; a one-click "copy tracking link" button is a small but real gap, flagging rather than skipping silently.
- [ ] Multi-touch / assisted-conversion attribution — NOT STARTED. Current model is last-touch only (the utm_campaign present at lead-creation time); this matches "Attribution" as scoped for this phase, not a full multi-touch model.
- [ ] Cost-per-lead / ROI calculation from `budget` — NOT STARTED. The `budget` field is stored but nothing divides it by leads yet; deferred to Phase 7 (Analytics) where it belongs alongside the rest of the reporting.

**Nothing above is marked TESTED** — requires npm install + a live Supabase
project with all migrations applied. See README.

## PHASE 6 — META PIXEL — functionally complete, pending one real local run
- [x] Settings page: real editable Meta Pixel ID field with format validation (digits only, 10-20 chars) — NEEDS-LOCAL-RUN. The app never generates or infers this value — only stores what the merchant enters from their own Meta Events Manager, per the Phase 1 note.
- [x] Secure public read path: `get_public_pixel_id()` SECURITY DEFINER function returns the Pixel ID only for a *published* page, so anon never gets direct read access to `workspaces` — IMPLEMENTED (not run against live DB)
- [x] Pixel base script + `<noscript>` fallback injected into the public page only when a Pixel ID is configured — NEEDS-LOCAL-RUN
- [x] Automatic `PageView` event (part of the base script) — NEEDS-LOCAL-RUN
- [x] `Lead` event fired client-side right after a successful form submission — NEEDS-LOCAL-RUN
- [x] `Contact` event fired when a visitor clicks a WhatsApp CTA (hero/cta sections) — NEEDS-LOCAL-RUN
- [ ] Meta Conversions API (server-side, deduplicated events) — NOT STARTED. This needs a securely-stored Meta access token per workspace, token refresh, and event-id deduplication with the client pixel — real scope, correctly deferred rather than half-built with a token field that has no encryption/rotation story yet.
- [ ] Custom/standard event mapping UI (e.g. mapping "won" leads to `Purchase`) — NOT STARTED, natural fit for Phase 7 once real analytics exist to validate against.

**Nothing above is marked TESTED** — requires npm install + a live Supabase
project with all migrations applied, AND a real Meta Pixel ID to see events
in Meta's Events Manager / Test Events tool. See README.

## PHASE 7 — ANALYTICS — functionally complete, pending one real local run
- [x] `leads_daily_counts` + `page_views_daily_counts` views (security_invoker = true, RLS-safe) — IMPLEMENTED (not run against live DB)
- [x] Analytics page: date range filter (7/30/90 days) via real query, no placeholder numbers — NEEDS-LOCAL-RUN
- [x] Trend chart (views vs. leads per day, recharts) with zero-filled gaps — NEEDS-LOCAL-RUN
- [x] Source breakdown chart (leads grouped by `source`) — NEEDS-LOCAL-RUN
- [x] Overview stats: views, leads, won, conversion rate — NEEDS-LOCAL-RUN
- [x] Cost-per-lead computed from real campaign budgets ÷ attributed leads in range (the Phase 5 deferred item) — NEEDS-LOCAL-RUN. Shown as "—" with an explanatory badge when no budget/attribution data exists yet, rather than a fake number.
- [x] Per-campaign breakdown chart (leads count per campaign, range-scoped) — IMPLEMENTED/NEEDS-LOCAL-RUN
- [x] Day-by-day per-campaign trend chart (one line per campaign, top 5 by volume in range) — new `campaign_daily_leads_counts` view (security_invoker=true, migration 0009) feeds a multi-series recharts line chart, pivoted server-side by day — NEEDS-LOCAL-RUN. Capped at the top 5 campaigns by volume; a workspace with more active campaigns will only chart its busiest 5, by design, to keep the chart legible — not a bug.
- [x] CSV export — added for both Leads (`/api/exports/leads`) and Analytics daily stats (`/api/exports/analytics`), real queries, UTF-8 BOM so Arabic text opens correctly in Excel — NEEDS-LOCAL-RUN. PDF export was not added (CSV covers the "get my data out" need; a formatted PDF report is a separate, more design-heavy piece of work).
- [x] One-click "تحديث" (refresh) button added to Analytics — calls `router.refresh()` to re-fetch current server data — NEEDS-LOCAL-RUN. This is NOT real-time/live-push: no Supabase Realtime subscription was built, so numbers still only update on page load or when this button is clicked, not automatically as new leads/views come in. Flagging clearly so "تحديث" isn't mistaken for live updates.

**Nothing above is marked TESTED** — requires npm install + a live Supabase
project with all migrations applied and some real traffic/leads to look at.
See README.

## PHASE 8 — TEAM + PLANS — functionally complete, pending one real local run
- [x] `workspaces.plan` column (free/starter/pro) — IMPLEMENTED (not run against live DB)
- [x] `workspace_invitations` table + RLS (admin-only manage; invitee looks up their own invite via a narrow token-based function, not by querying the table directly) — IMPLEMENTED (not run against live DB)
- [x] `get_invitation_by_token` / `accept_workspace_invitation` SECURITY DEFINER functions, with email-match + expiry + already-used checks done server-side — IMPLEMENTED (not run against live DB)
- [x] Fixed a real RLS gap surfaced while building this: `profiles` previously only allowed reading your OWN row, which would have silently broken the team member list (empty names, no error) — added a co-worker visibility policy instead of working around it in app code — IMPLEMENTED (not run against live DB)
- [x] Team page: member list with role editing/removal, invite form, pending-invitations list with shareable link — NEEDS-LOCAL-RUN
- [x] Public invite acceptance page `/invite/[token]` — works for logged-out visitors (shows invite details, prompts sign in/signup), then accepts via the secure function — NEEDS-LOCAL-RUN
- [x] Plan limit enforcement: landing pages and team invites are actually blocked once a workspace hits its plan's limit (not just displayed) — NEEDS-LOCAL-RUN
- [x] Usage-vs-limit display on the Team page (pages/members/campaigns) — NEEDS-LOCAL-RUN
- [x] Fixed a second pre-existing gap while touching middleware: `/landing-pages`, `/campaigns`, `/analytics`, `/team` were never actually in the middleware's protected-route list (pages still redirected via their own server-side check, so not a real security hole, just an extra round trip) — now all dashboard sections are covered consistently.
- [ ] **No email is actually sent for invitations.** No email provider is configured (`EMAIL_PROVIDER_API_KEY` is a placeholder in `.env.example`) — invites are link-based and must be shared manually by the admin. This is a real, working mechanism, just not the automated one a configured provider (Resend/Postmark/etc.) would give you. Flagging clearly rather than implying emails go out.
- [ ] **No real billing/checkout.** There is no Stripe (or other) integration — `setPlanForTestingAction` lets the workspace owner switch plans directly as a manual testing control, clearly labeled as such in the UI. Building real checkout needs a live Stripe account, webhook endpoint, and secret key, none of which exist here.
- [x] Campaign count against plan limit — fixed during review: real count query added to the Team page (no more placeholder "0"), and `createCampaignAction` now enforces the same limit as landing pages — NEEDS-LOCAL-RUN

**Nothing above is marked TESTED** — requires npm install + a live Supabase
project with all migrations applied. See README.

## PHASE 9 — POLISH — functionally complete, pending one real local run
- [x] Fixed the `useSearchParams()` Suspense-boundary gap flagged back in Phase 4/7 — the public lead form is now properly wrapped in `<Suspense>` with a skeleton fallback — IMPLEMENTED
- [x] **Fixed a real gap found while polishing: there was no root `/` page at all** — visiting the bare domain would 404. Added `app/page.tsx` that redirects to `/dashboard` or `/login` depending on auth state — IMPLEMENTED/NEEDS-LOCAL-RUN
- [x] Custom Arabic/RTL 404 page (`not-found.tsx`) — IMPLEMENTED
- [x] Dashboard loading skeleton (`(dashboard)/loading.tsx`) shown during server data fetches instead of a blank screen — IMPLEMENTED
- [x] Dashboard error boundary (`(dashboard)/error.tsx`) with a retry button instead of a raw crash/white screen — IMPLEMENTED
- [x] Root `global-error.tsx` for the rare case the root layout itself crashes — IMPLEMENTED
- [x] `robots.txt` (via `app/robots.ts`) — disallows dashboard/auth/api routes from indexing, explicitly allows `/p/` — IMPLEMENTED
- [ ] No `sitemap.xml` was added. This was a deliberate judgment call, not an oversight: a single combined sitemap would enumerate every tenant's public landing pages under one file, which conflates unrelated businesses into one "site" for search engines — each landing page already gets its own per-page `<title>`/description via `generateMetadata` (Phase 3), which is the SEO lever that actually matters per page. Flagging so a sitemap isn't assumed to exist.
- [ ] No error-monitoring integration (Sentry or similar) wired up — `(dashboard)/error.tsx` only `console.error`s for now, since no monitoring service/API key is configured. A real deployment should add one.
- [ ] Real CAPTCHA/Turnstile bot protection — still NOT STARTED (see Phase 4 note); the rate limit + honeypot remain the only bot defenses.
- [ ] No automated test suite (unit/e2e) was written anywhere in this project. Given the scope already covered across 9 phases, this is a genuine gap worth naming plainly rather than leaving implicit — see README for how to verify manually until tests exist.

**Nothing above is marked TESTED** — requires npm install + a live Supabase
project with all migrations applied. See README.

## PHASE 10 — PRODUCTION AUDIT — complete (manual/static review; see PRODUCTION_AUDIT.md)
- [x] RLS coverage audit: all 12 tables across 9 migrations confirmed to have RLS enabled — 0 gaps found.
- [x] SECURITY DEFINER function exposure audit — found and fixed 1 real gap: `is_workspace_member`/`is_workspace_admin` were left at Postgres's default PUBLIC-executable grant since Phase 1; now explicitly restricted to `authenticated` (migration 0010). Low impact (boolean-only, no data leak) but fixed for defense-in-depth.
- [x] Workspace-scoping consistency audit across every server action — found and fixed 1 inconsistency: `completeFollowUpAction` was relying on RLS alone without the explicit `.eq('workspace_id', ...)` defense-in-depth filter used everywhere else. Not an actual hole (RLS enforced it correctly regardless) — fixed for consistency.
- [x] Env var audit: every `process.env.*` used in code has a matching `.env.example` entry, and vice versa — no phantom or undocumented vars.
- [x] No leftover TODO/FIXME/placeholder markers anywhere in the codebase.
- [x] Confirmed `createAdminClient()` (service role) is defined but never called — intentional scaffolding for future trusted server-only code (Stripe webhooks, cron), not dead code to remove.
- [x] Migration ordering verified: all 10 migrations reference only objects created in earlier-numbered files.
- [x] `PRODUCTION_AUDIT.md` added with the full findings above plus a concrete go-live checklist.

**This audit is a manual/static code review, not a live-system verification** — no query was ever actually executed against a real database, no `npm install`/build/typecheck was run, and no dependency vulnerability scan was possible, all because this sandbox has no network access. See PRODUCTION_AUDIT.md's go-live checklist for what must still be done in a real environment before this goes live.

---

## Overall project status
All 10 phases are functionally complete as source code. Nothing anywhere
in this project is marked TESTED in the sense of "actually run and
observed to work" — every NEEDS-LOCAL-RUN item requires the one-time
local setup in README.md (npm install + a real Supabase project). The
honest gaps deliberately left open across all phases (no real email
sending, no real billing/Stripe, no CAPTCHA, no error monitoring, no
automated tests, no Meta Conversions API) are listed in each phase's
section above and in PRODUCTION_AUDIT.md's go-live checklist — treat
that checklist as required reading before pointing real traffic at this.

## FEATURE BATCH — requested additions (Kanban, notifications, tags, Stripe, etc.)

- [x] **Tags system** (VIP/ساخن/بارد + custom) — `leads.tags` column, editor with presets, filter in leads list — IMPLEMENTED/NEEDS-LOCAL-RUN
- [x] **Workspace Activity Log** (who edited a page, who deleted a lead, who added/removed a member) — tamper-resistant (written only by SECURITY DEFINER triggers, no direct insert policy), own page at `/activity` — IMPLEMENTED/NEEDS-LOCAL-RUN
- [x] **Notification Center** — bell icon in header, real-time-on-load unread count, auto-notifications on new lead / new campaign / plan expiring soon — IMPLEMENTED/NEEDS-LOCAL-RUN. Plan-expiry check is opportunistic (runs on dashboard page load, self-rate-limited to 1/24h) rather than a true scheduled cron job — see note below.
- [x] **Executive Dashboard** — today's leads, today's conversion rate, best campaign (all-time), new customers (won today), recent activity feed merging lead-level + workspace-level events — IMPLEMENTED/NEEDS-LOCAL-RUN
- [x] **Visual Pipeline (Kanban)** at `/leads/pipeline` — drag-and-drop on desktop (native HTML5 DnD), dropdown fallback per card on mobile (native HTML5 drag has poor touch support) — IMPLEMENTED/NEEDS-LOCAL-RUN
- [x] **Funnel chart** (Views → Form submissions → Contacted → Won) in Analytics — IMPLEMENTED/NEEDS-LOCAL-RUN
- [x] **Global Search** — searches leads/landing pages/campaigns from a header search bar, debounced — IMPLEMENTED/NEEDS-LOCAL-RUN
- [x] **CSV Import** for leads — dependency-free parser (handles quoted fields), header aliasing (Arabic or English column names), 500-row/2MB cap per import, sample template download — IMPLEMENTED/NEEDS-LOCAL-RUN. No duplicate detection during bulk import (only on the manual single-add form) — documented in-page.
- [x] **Excel export** (`/api/exports/leads-xlsx`) added alongside the existing CSV export, using SheetJS — IMPLEMENTED/NEEDS-LOCAL-RUN
- [x] **Duplicate Landing Page** button — copies title/sections/WhatsApp number/SEO meta, always starts as an unpublished draft even if the original was live — IMPLEMENTED/NEEDS-LOCAL-RUN
- [x] **Auto-template on signup** — the landing page onboarding now auto-creates a draft page from the template matching the chosen industry, instead of leaving a blank state — IMPLEMENTED/NEEDS-LOCAL-RUN
- [x] **Duplicate lead detection** — warns (does not block) when adding a lead manually if the phone or email already exists in the workspace — IMPLEMENTED/NEEDS-LOCAL-RUN
- [x] **Real Stripe integration** — Checkout Session creation, webhook handling `checkout.session.completed` / `customer.subscription.updated` / `customer.subscription.deleted` to actually update `workspaces.plan`, and a Billing Portal link for self-service cancellation — IMPLEMENTED, code-complete. **Requires a real Stripe account and price IDs to function** (see `.env.example`); falls back cleanly to the existing manual test-only plan selector when Stripe isn't configured, rather than breaking.
- [ ] **True background job for plan-expiry notifications** — NOT STARTED as a real cron; current check only fires when someone loads the dashboard. A production deployment should add a scheduled job (Supabase supports `pg_cron`) calling `check_plan_expiry_notification` for every workspace daily — this is an infra/ops decision left for go-live setup, not built here.
- [ ] **Multi-page website builder** (multiple pages per site, navigation menu, Blog/About/Contact page types) — explicitly NOT built. This is a materially different product from a landing-page builder: it needs a page-tree/site-navigation data model, multiple page *types* (not just sections), and a different editing paradigm. Bolting it onto the existing single-page-per-campaign model would either be fake (a few hardcoded page templates with no real site structure) or a half-built rewrite of Phase 3. Flagging clearly rather than shipping either.

### Security findings from this batch (found and fixed during self-review, not by the user)
- Two internal helper functions, `log_workspace_activity()` and `notify_workspace_members()`, take a raw `workspace_id` argument with no membership check inside them — safe only because they're meant to be called exclusively from other SECURITY DEFINER trigger functions. Both were initially left at Postgres's default PUBLIC-executable grant (the same class of gap the Phase 10 audit found and fixed for `is_workspace_member`/`is_workspace_admin`). If left exposed, any authenticated user could have called them directly via RPC to forge fake audit-log entries or spam phishing-style notifications into ANY workspace, not just their own. Fixed by explicitly revoking PUBLIC execute and granting to no role at all — they still work correctly when called internally by the trigger functions, since a SECURITY DEFINER function's nested calls run under its owner's privileges regardless of the outer caller's own grants.
- Re-ran the full audit battery from Phase 10 (RLS coverage, function grants, `any`/`@ts-ignore` scan, import resolution, `'use server'`/`'use client'` directive check) against the entire project after this batch — all pass with zero gaps beyond the one fixed above.

## PLAN TIER RESTRUCTURE — 4 tiers matching the approved pricing table (25,000 IQD starting point)

- [x] Added a 4th tier, **Growth (نمو)**, between Starter and Pro — `workspace_plan` enum extended (migration 0014) — IMPLEMENTED/NEEDS-LOCAL-RUN
- [x] `lib/plans/constants.ts` rewritten: numeric limits (pages/members/campaigns) AND a new `PLAN_FEATURES` boolean-gate system (`hasFeature(plan, feature)`) for everything that isn't count-based — IMPLEMENTED
- [x] `requireWorkspace()` now returns `plan` directly (one query, used everywhere) instead of every action re-fetching it separately — also cleaned up 3 pre-existing call sites (`createLandingPageAction`, `createCampaignAction`, `inviteMemberAction`) that were each doing their own redundant `workspaces.plan` query before this existed.
- [x] Added `requirePlanFeature()` — server-side gate that redirects with a clear upgrade message, same pattern as the existing plan-limit redirects.

### Feature gates actually wired end-to-end (UI hidden AND server-enforced, not just one or the other):
- [x] Free-tier "Powered by SocialSales OS" badge on public landing pages — new `get_public_workspace_plan()` function (migration 0015), same narrow-accessor pattern as the Pixel ID function.
- [x] Meta Pixel — `get_public_pixel_id()` re-defined (migration 0015) to only return a value for Starter+ workspaces, so a workspace that downgrades stops tracking even if an old Pixel ID is still stored. Settings page shows an explicit "requires Starter+" badge.
- [x] Kanban Pipeline (`/leads/pipeline`) — gated server-side, link hidden below Starter.
- [x] Tags — gated in both the update action and the lead-detail UI.
- [x] Duplicate detection (manual add-lead form) — gated in the action itself (returns null silently below Starter, no broken UI).
- [x] Duplicate Landing Page — gated in the action.
- [x] CSV Import — gated in the action (page itself still renders below the required plan, but submitting fails with a clear message — noted below as a partial gap).
- [x] Excel export — gated in the API route itself (403 if plan doesn't qualify), not just the visible link.
- [x] Activity Log — gated at the page level.
- [x] Global Search — gated both in the Header (hidden below Starter) and the `/api/search` route itself (403).
- [x] Notification Center — gated in the Header (bell hidden below Starter).
- [x] Stripe checkout/price mapping extended to include the Growth tier (`STRIPE_PRICE_ID_GROWTH`).

### Known partial gaps in this restructure (flagged honestly, not hidden):
- [ ] The CSV import **page** (`/leads/import`) doesn't do a server-side redirect for a workspace below Growth — only the underlying `importLeadsCsvAction` rejects the submission with a message. A determined user on Free/Starter can still see the upload form, just can't actually import. Functionally safe (nothing bypasses the plan check), just not the cleanest UX — flagging rather than leaving it undocumented.
- [ ] Sidebar navigation items (Activity Log, etc.) are NOT hidden per-plan — every nav link is always visible to every plan; clicking one below your plan just redirects with an upgrade message (same pattern used for count-based limits throughout the whole project, e.g. the "Add landing page" button is always visible too). This is a deliberate consistency choice, not an oversight, but it does mean lower-tier users see menu items they can't use until they click.
- [ ] Notification-generating triggers (`notify_new_lead`, `notify_new_campaign`) fire regardless of plan — a Free-tier workspace still accumulates notification rows in the database, they're just never surfaced in the UI (Header hides the bell entirely below Starter). Harmless but slightly wasteful; a plan-aware trigger would be more efficient but adds real complexity for a cosmetic-only benefit, so it was left as is.
- [ ] The 4-tier pricing table's exact IQD amounts (25,000 / ~65,000 / ~140,000) are **not stored anywhere in the code** — Stripe Price objects (created in your own Stripe Dashboard) are the actual source of truth for prices, by design, so you can change pricing anytime without touching code. The numeric plan *limits* (pages/members/campaigns) ARE in the code (`lib/plans/constants.ts`) and match the approved table exactly.

**Nothing above is marked TESTED** — requires npm install + a live Supabase
project with all 15 migrations applied. See README.

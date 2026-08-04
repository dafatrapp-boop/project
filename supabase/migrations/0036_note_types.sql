-- =====================================================================
-- Phase 36 — Typed lead notes (product-gaps review ب.4).
--
-- Every note was a plain free-text blob with no classification, so
-- "when was the last phone call with this customer" had no answer
-- short of reading every note's text. Adds an optional `note_type` to
-- lead_notes. Deliberately `text` + `CHECK` rather than a new Postgres
-- enum — this project's own architecture review (item 4) flags enums
-- as the wrong choice for any value a merchant-facing UI might need to
-- extend later, and a note "type" is exactly that kind of value.
-- =====================================================================

alter table public.lead_notes add column if not exists note_type text not null default 'general';

do $$
begin
  alter table public.lead_notes
    add constraint lead_notes_note_type_check
    check (note_type in ('general', 'call', 'meeting', 'email', 'whatsapp'));
exception when duplicate_object then null;
end $$;

'use client';

import { useEffect, useMemo, useState, useTransition, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { bookAppointmentAction } from '@/app/p/[slug]/actions';

interface Settings {
  enabled: boolean;
  working_days: number[];
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  max_bookings_per_slot: number;
  holidays: string[];
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function buildSlots(settings: Settings): string[] {
  const slots: string[] = [];
  const [startH, startM] = settings.start_time.split(':').map(Number);
  const [endH, endM] = settings.end_time.split(':').map(Number);
  let cursor = startH * 60 + startM;
  const end = endH * 60 + endM;
  while (cursor < end) {
    const h = Math.floor(cursor / 60);
    const m = cursor % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    cursor += settings.slot_duration_minutes;
  }
  return slots;
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: 'يرجى تعبئة الاسم واختيار التاريخ والوقت، ورقم الهاتف أو البريد.',
  rate_limited: 'تم إرسال عدة طلبات، يرجى المحاولة لاحقًا.',
  slot_full: 'هذا الوقت أصبح محجوزًا بالكامل، يرجى اختيار وقت آخر.',
  unavailable: 'هذا الوقت غير متاح، يرجى اختيار يوم أو وقت آخر.',
  submit_failed: 'تعذر إتمام الحجز. حاول مرة أخرى.',
  rejected: 'تعذر إتمام الحجز.',
};

export function AppointmentBookingWidget({
  landingPageId,
  title,
  description,
  submitLabel,
}: {
  landingPageId: string;
  title: string;
  description: string;
  submitLabel: string;
}) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayIso());
  const [takenCounts, setTakenCounts] = useState<Record<string, number>>({});
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .rpc('get_public_appointment_settings', { p_landing_page_id: landingPageId })
      .then(({ data }) => {
        setSettings((data?.[0] as Settings) ?? null);
        setLoading(false);
      });
  }, [landingPageId]);

  useEffect(() => {
    if (!date) return;
    const supabase = createClient();
    supabase
      .rpc('get_public_booked_slots', { p_landing_page_id: landingPageId, p_date: date })
      .then(({ data }) => {
        const map: Record<string, number> = {};
        for (const row of data ?? []) {
          map[String(row.start_time).slice(0, 5)] = row.taken_count;
        }
        setTakenCounts(map);
      });
  }, [date, landingPageId]);

  const isHoliday = settings?.holidays.includes(date) ?? false;
  const weekday = date ? new Date(date + 'T00:00:00').getDay() : null;
  const isWorkingDay = settings ? weekday !== null && settings.working_days.includes(weekday) : false;

  const slots = useMemo(() => (settings ? buildSlots(settings) : []), [settings]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedTime) {
      setError('يرجى اختيار وقت الموعد.');
      return;
    }
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('date', date);
    formData.set('time', selectedTime);

    startTransition(async () => {
      const result = await bookAppointmentAction(landingPageId, formData);
      if (!result.ok) {
        setError(ERROR_MESSAGES[result.error ?? 'submit_failed']);
        return;
      }
      setSuccess(true);
    });
  }

  if (loading) {
    return (
      <section className="px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-md rounded-lg border border-border bg-surface p-6 shadow-card">
          <div className="h-11 animate-pulse rounded-md bg-surface-subtle" />
        </div>
      </section>
    );
  }

  if (!settings || !settings.enabled) return null;

  if (success) {
    return (
      <section className="px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-md rounded-lg border border-success/30 bg-success/5 p-6 text-center shadow-card">
          <h2 className="mb-1 text-xl font-semibold text-ink">تم استلام حجزك بنجاح</h2>
          <p className="text-sm text-ink-muted">سنتواصل معك لتأكيد الموعد قريبًا.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-md rounded-lg border border-border bg-surface p-6 shadow-card">
        <h2 className="mb-1 text-xl font-semibold text-ink">{title}</h2>
        <p className="mb-5 text-sm text-ink-muted">{description}</p>

        {error && (
          <div className="mb-4 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            name="company_website"
            tabIndex={-1}
            autoComplete="off"
            className="absolute -left-[9999px]"
            aria-hidden="true"
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">اختر اليوم</span>
            <input
              type="date"
              min={todayIso()}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSelectedTime(null);
              }}
              className="h-11 rounded-md border border-border bg-surface px-3 text-sm text-ink focus-visible:border-brand-500"
            />
          </label>

          {isHoliday ? (
            <p className="text-sm text-warning">هذا اليوم إجازة — يرجى اختيار يوم آخر.</p>
          ) : !isWorkingDay ? (
            <p className="text-sm text-warning">لا يوجد دوام في هذا اليوم — يرجى اختيار يوم آخر.</p>
          ) : (
            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink">اختر الوقت</span>
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => {
                  const full = (takenCounts[slot] ?? 0) >= settings.max_bookings_per_slot;
                  return (
                    <button
                      type="button"
                      key={slot}
                      disabled={full}
                      onClick={() => setSelectedTime(slot)}
                      className={`h-9 rounded-md border text-sm ${
                        full
                          ? 'cursor-not-allowed border-border bg-surface-subtle text-ink-faint line-through'
                          : selectedTime === slot
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-border text-ink hover:bg-surface-subtle'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <input
            name="customerName"
            required
            placeholder="الاسم الكامل"
            className="h-11 rounded-md border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus-visible:border-brand-500"
          />
          <input
            name="phone"
            placeholder="رقم الهاتف"
            className="h-11 rounded-md border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus-visible:border-brand-500"
          />
          <input
            name="email"
            type="email"
            placeholder="البريد الإلكتروني (اختياري)"
            className="h-11 rounded-md border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus-visible:border-brand-500"
          />

          <button
            type="submit"
            disabled={pending || isHoliday || !isWorkingDay}
            className="mt-1 h-11 rounded-md bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {pending ? 'جارٍ الحجز...' : submitLabel}
          </button>
        </form>
      </div>
    </section>
  );
}

import { NextResponse } from 'next/server';

/**
 * Lets the service worker re-derive the VAPID applicationServerKey when
 * recovering from a `pushsubscriptionchange` event (see public/sw.js) —
 * a plain classic-script service worker can't import
 * lib/push/vapid.ts or read NEXT_PUBLIC_* build-time env vars directly,
 * so it fetches this instead. Not a secret: NEXT_PUBLIC_ vars are
 * already shipped to every browser bundle; this just exposes the same
 * value at a stable URL a service worker can reach.
 */
export async function GET() {
  return NextResponse.json({ key: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null });
}

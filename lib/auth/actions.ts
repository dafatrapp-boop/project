'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Signs the current user out of their Supabase session and sends them
 * back to the login screen. Used by the LogoutButton component, which
 * is rendered in the desktop sidebar and the mobile "More" page — the
 * only two places dashboard chrome is guaranteed to appear.
 */
export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Next.js remounts template.tsx (unlike layout.tsx) on every
 * navigation within this route group — exactly the hook needed for a
 * per-page entrance animation without re-mounting (and re-flashing)
 * the persistent Sidebar/Header/MobileNav in the layout above this.
 * Kept intentionally subtle (8px rise + fade, 180ms) — a page
 * transition should read as "fluid," not as a slide show.
 */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

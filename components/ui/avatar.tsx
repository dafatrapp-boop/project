import { cn } from '@/lib/utils';

const SIZES = { sm: 'h-7 w-7 text-micro', md: 'h-9 w-9 text-caption', lg: 'h-12 w-12 text-body' };

// Small deterministic hue offset from the brand hue so different
// people get visually distinct (but still on-brand) avatar colors
// without needing a photo.
const TINTS = [
  'bg-brand-100 text-brand-700',
  'bg-success-50 text-success',
  'bg-warning-50 text-warning',
  'bg-info-50 text-info',
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[parts.length - 1][0];
}

function tintFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length];
}

/**
 * Phase 2 — new primitive. Team member rows / activity log / lead
 * assignment (wherever a person needs representing) currently fall
 * back to plain text names — this gives the product a face without
 * requiring photo uploads.
 */
export function Avatar({ name, size = 'md', className }: { name: string; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase',
        SIZES[size],
        tintFor(name),
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

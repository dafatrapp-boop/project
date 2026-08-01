import type { Config } from 'tailwindcss';

// Design system tokens for SocialSales OS.
// All spacing/layout utilities used across the app must be LOGICAL
// (ms-/me-/ps-/pe-/start-/end-) instead of physical (ml-/mr-/left-/right-)
// so the UI mirrors correctly in RTL (Arabic) without per-component overrides.
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-arabic)', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          sunken: 'hsl(var(--surface-sunken))',
          subtle: 'hsl(var(--surface-subtle))',
          raised: 'hsl(var(--surface-raised))',
          overlay: 'hsl(var(--surface-overlay))',
        },
        border: {
          DEFAULT: 'hsl(var(--border))',
          strong: 'hsl(var(--border-strong))',
        },
        ink: {
          DEFAULT: 'hsl(var(--ink))',
          muted: 'hsl(var(--ink-muted))',
          faint: 'hsl(var(--ink-faint))',
          onbrand: 'hsl(var(--ink-on-brand))',
        },
        brand: {
          50: 'hsl(var(--brand-50))',
          100: 'hsl(var(--brand-100))',
          200: 'hsl(var(--brand-200))',
          300: 'hsl(var(--brand-300))',
          400: 'hsl(var(--brand-400))',
          500: 'hsl(var(--brand-500))',
          600: 'hsl(var(--brand-600))',
          700: 'hsl(var(--brand-700))',
          800: 'hsl(var(--brand-800))',
          900: 'hsl(var(--brand-900))',
        },
        neutral: {
          100: 'hsl(var(--neutral-100))',
          300: 'hsl(var(--neutral-300))',
          500: 'hsl(var(--neutral-500))',
          700: 'hsl(var(--neutral-700))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          50: 'hsl(var(--success-50))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          50: 'hsl(var(--warning-50))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          50: 'hsl(var(--danger-50))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          50: 'hsl(var(--info-50))',
        },
      },
      // Typographic scale. Each size is paired with a purpose-matched
      // line-height and tracking so components never need one-off
      // leading-*/tracking-* overrides. Arabic script needs slightly
      // looser leading than Latin at small sizes to stay legible.
      fontSize: {
        'display': ['32px', { lineHeight: '1.25', letterSpacing: '-0.015em', fontWeight: '650' }],
        'title-lg': ['24px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'title': ['20px', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
        'title-sm': ['17px', { lineHeight: '1.4', letterSpacing: '-0.005em', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.55', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.5', fontWeight: '500' }],
        'micro': ['11px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.01em' }],
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      spacing: {
        18: '4.5rem',
      },
      // Elevation ladder. "subtle" = resting card, "card" = default
      // raised surface, "overlay" = dropdown/tooltip, "elevated" =
      // modal/dialog, "glow" = brand-colored emphasis (primary CTA,
      // selected states) — kept separate from the neutral ladder since
      // it's a color effect, not a height effect.
      boxShadow: {
        subtle: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        overlay: '0 12px 24px -8px rgb(20 20 40 / 0.14), 0 4px 8px -4px rgb(20 20 40 / 0.06)',
        elevated: '0 24px 48px -12px rgb(20 20 40 / 0.18), 0 4px 12px -4px rgb(20 20 40 / 0.08)',
        glow: '0 8px 24px -6px hsl(var(--brand-500) / 0.45)',
        'inner-border': 'inset 0 0 0 1px hsl(var(--border))',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '180ms',
        slow: '320ms',
      },
      screens: {
        // Documented for clarity; these match Tailwind defaults exactly
        // (no override) — see design-system.md §"Breakpoints".
      },
    },
  },
  plugins: [],
};

export default config;

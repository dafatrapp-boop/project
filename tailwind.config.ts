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
          subtle: 'hsl(var(--surface-subtle))',
          raised: 'hsl(var(--surface-raised))',
        },
        border: 'hsl(var(--border))',
        ink: {
          DEFAULT: 'hsl(var(--ink))',
          muted: 'hsl(var(--ink-muted))',
          faint: 'hsl(var(--ink-faint))',
        },
        brand: {
          50: 'hsl(var(--brand-50))',
          100: 'hsl(var(--brand-100))',
          400: 'hsl(var(--brand-400))',
          500: 'hsl(var(--brand-500))',
          600: 'hsl(var(--brand-600))',
          700: 'hsl(var(--brand-700))',
          900: 'hsl(var(--brand-900))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          50: 'hsl(var(--success-50))',
        },
        warning: 'hsl(var(--warning))',
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          50: 'hsl(var(--danger-50))',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '28px',
      },
      spacing: {
        18: '4.5rem',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        elevated: '0 24px 48px -12px rgb(20 20 40 / 0.18), 0 4px 12px -4px rgb(20 20 40 / 0.08)',
        glow: '0 8px 24px -6px hsl(var(--brand-500) / 0.45)',
      },
    },
  },
  plugins: [],
};

export default config;

import type { ReactNode } from 'react';
import { MessageCircle, CheckCheck, TrendingUp } from 'lucide-react';

interface AuthShellProps {
  children: ReactNode;
  /** Panel copy changes slightly per step, same visual motif throughout. */
  panelEyebrow?: string;
  panelTitle: string;
  panelSubtitle: string;
  /** Width of the form column. Onboarding steps need a bit more room. */
  formWidth?: 'sm' | 'md' | 'lg';
}

const formWidths = {
  sm: 'max-w-[400px]',
  md: 'max-w-[460px]',
  lg: 'max-w-[560px]',
};

/**
 * Every auth & onboarding screen shares this shell: a brand storytelling
 * panel (desktop/tablet only) + a centered form column. The panel's
 * conversation-thread mockup is the one signature visual for this phase —
 * it dramatizes the product's actual job (turning a social DM into a
 * paying customer) instead of a generic gradient.
 */
export function AuthShell({
  children,
  panelEyebrow = 'SocialSales OS',
  panelTitle,
  panelSubtitle,
  formWidth = 'sm',
}: AuthShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,560px)_1fr]">
      {/* Brand panel — first in DOM so it sits on the reading-start side in RTL */}
      <aside className="relative hidden overflow-hidden bg-brand-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div
          className="pointer-events-none absolute -end-24 -top-24 h-[420px] w-[420px] rounded-full bg-brand-500/30 blur-[100px]"
          aria-hidden
        />

        <div className="relative z-10 flex items-center gap-2 text-sm font-semibold tracking-tight text-white/90">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
            <MessageCircle size={15} strokeWidth={2.5} />
          </span>
          {panelEyebrow}
        </div>

        <div className="relative z-10 my-10">
          <h2 className="mb-3 max-w-md text-[28px] font-semibold leading-[1.3] tracking-[-0.01em] text-white">
            {panelTitle}
          </h2>
          <p className="max-w-sm text-[15px] leading-relaxed text-white/60">{panelSubtitle}</p>
        </div>

        {/* Signature visual: a conversation turning into a customer */}
        <div className="relative z-10 stagger flex flex-col gap-2.5">
          <div className="animate-rise-in ms-0 me-auto max-w-[78%] rounded-2xl rounded-ss-md bg-white/10 px-4 py-2.5 text-sm text-white/85 backdrop-blur-sm">
            وصلني إعلانكم، متوفر عندكم مواعيد اليوم؟
          </div>
          <div className="animate-rise-in ms-auto me-0 max-w-[78%] rounded-2xl rounded-se-md bg-brand-500 px-4 py-2.5 text-sm text-white shadow-glow">
            أهلًا بك! نعم متوفر الساعة ٥ مساءً، أحجز لك؟
          </div>
          <div className="animate-rise-in flex items-center gap-1.5 ms-0 me-auto rounded-2xl rounded-ss-md bg-white/10 px-4 py-2.5 text-sm text-white/85 backdrop-blur-sm">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-white/70" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-white/70" style={{ animationDelay: '200ms' }} />
              <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-white/70" style={{ animationDelay: '400ms' }} />
            </span>
          </div>
          <div className="animate-rise-in mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-medium text-white/70">
            <CheckCheck size={14} className="shrink-0 text-brand-400" />
            تم تحويل الزائر إلى عميل جديد
            <TrendingUp size={13} className="ms-auto shrink-0 text-brand-400" />
          </div>
        </div>
      </aside>

      {/* Form column */}
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface-subtle px-5 py-12 sm:px-8">
        {/* Compact brand mark for mobile/tablet, where the panel is hidden */}
        <div className={`mb-8 flex w-full items-center gap-2 lg:hidden ${formWidths[formWidth]}`}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
            <MessageCircle size={16} strokeWidth={2.5} />
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">SocialSales OS</span>
        </div>

        <div className={`w-full ${formWidths[formWidth]} animate-drift-in`}>{children}</div>
      </main>
    </div>
  );
}

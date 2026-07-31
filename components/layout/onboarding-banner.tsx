import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function OnboardingBanner({ progress }: { progress: number }) {
  return (
    <Link
      href="/onboarding/setup"
      className="flex items-center justify-between gap-3 border-b border-brand-100 bg-brand-50 px-4 py-2.5 text-sm md:px-8"
    >
      <span className="flex items-center gap-2 font-medium text-brand-700">
        <Sparkles size={16} />
        استكمل إعداد حسابك ({progress}%)
      </span>
      <span className="text-xs text-brand-600 underline">متابعة الإعداد</span>
    </Link>
  );
}

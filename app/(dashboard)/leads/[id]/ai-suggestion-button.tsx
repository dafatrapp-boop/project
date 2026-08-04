'use client';

import { useState, useTransition } from 'react';
import { Sparkles, Copy, Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { suggestFollowUpMessageAction } from '../actions';
import { whatsAppLink } from '@/lib/utils';

const SOURCE_LABEL: Record<string, string> = {
  gemini: 'بالذكاء الاصطناعي (Gemini، مجانًا)',
  groq: 'بالذكاء الاصطناعي (Groq، مجانًا)',
  offline: 'اقتراح ذكي جاهز (بدون إنترنت)',
};

export function AiSuggestionButton({ leadId, phone }: { leadId: string; phone: string | null }) {
  const [message, setMessage] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function generate() {
    startTransition(async () => {
      const result = await suggestFollowUpMessageAction(leadId);
      if (!result) return;
      setMessage(result.message);
      setSource(result.source);
      setCopied(false);
    });
  }

  function copy() {
    if (!message) return;
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" size="sm" onClick={generate} loading={pending} disabled={pending}>
        <Sparkles size={14} />
        اقترح رسالة متابعة
      </Button>

      {message && (
        <div className="rounded-md border border-border bg-surface-subtle p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            {source && <Badge tone="neutral" size="sm">{SOURCE_LABEL[source] ?? source}</Badge>}
          </div>
          <p className="text-body-sm text-ink">{message}</p>
          <div className="mt-2 flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={copy}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'تم النسخ' : 'نسخ'}
            </Button>
            {phone && (
              <a
                href={whatsAppLink(phone, message)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-body-sm font-medium text-success transition-colors hover:bg-success-50"
              >
                <MessageCircle size={14} />
                إرسال عبر واتساب
              </a>
            )}
          </div>
          {source === 'offline' && (
            <p className="mt-2 text-caption text-ink-faint">
              هذا اقتراح مبني على قواعد بسيطة. للحصول على رسائل أدق تراعي تفاصيل كل عميل، فعّل مفتاح Gemini
              المجاني من{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline">
                Google AI Studio
              </a>
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}

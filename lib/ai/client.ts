/**
 * AI-assisted follow-up message drafting — genuinely free, no paid
 * API required at any tier.
 *
 * Layered design (each layer only activates if the one above isn't
 * usable), so the feature is NEVER a dead button, and NEVER requires
 * payment:
 *
 *   1. Google Gemini API (free tier via Google AI Studio) — no credit
 *      card, no expiring trial credits, ongoing free quota (as of
 *      this writing: Gemini 2.5 Flash — 10 requests/min, 250/day,
 *      250k tokens/min; Flash-Lite — 15/min, 1,000/day). For a "click
 *      once per lead" CRM feature that's far more headroom than any
 *      small business will hit. Get a key at
 *      https://aistudio.google.com/apikey — GEMINI_API_KEY.
 *   2. Groq API (free tier, no credit card) — 30 requests/min,
 *      14,400/day, runs open models (Llama) on very fast custom
 *      hardware. A good alternative/backup if Gemini's daily cap is
 *      ever hit, or simply the preferred option for some deployments.
 *      Get a key at https://console.groq.com/keys — GROQ_API_KEY.
 *   3. Offline rule-based composer — zero signup, zero network call,
 *      zero cost, always available. Not "real" generative AI, but a
 *      genuinely useful templated draft built from the lead's actual
 *      status/tags/timing — so a workspace that never configures
 *      anything still gets a usable suggestion instead of a dead
 *      button or a paywall message.
 *
 * Both hosted options are used via plain `fetch` (no SDK dependency),
 * matching the pattern already used for Resend/Turnstile elsewhere in
 * this project.
 */

export type AiSource = 'gemini' | 'groq' | 'offline';

export function isHostedAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY);
}

interface GenerateOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
}

async function generateWithGemini({ system, prompt, maxTokens = 250 }: GenerateOptions): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const model = 'gemini-2.5-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: system }] },
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
        }),
      }
    );

    if (!response.ok) {
      console.error('[ai] Gemini API error:', response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
    return text?.trim() || null;
  } catch (error) {
    console.error('[ai] Gemini generation failed:', error);
    return null;
  }
}

async function generateWithGroq({ system, prompt, maxTokens = 250 }: GenerateOptions): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error('[ai] Groq API error:', response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('[ai] Groq generation failed:', error);
    return null;
  }
}

/** Gemini first (larger context, strong Arabic quality), Groq second — both free. */
async function generateWithHostedAi(options: GenerateOptions): Promise<{ text: string; source: AiSource } | null> {
  const gemini = await generateWithGemini(options);
  if (gemini) return { text: gemini, source: 'gemini' };

  const groq = await generateWithGroq(options);
  if (groq) return { text: groq, source: 'groq' };

  return null;
}

export interface LeadAiContext {
  fullName: string;
  status: string;
  statusLabel: string;
  tags: string[];
  recentNotes: string[];
  daysSinceCreated: number;
}

/**
 * Offline fallback — a small rule-based composer, not a language
 * model. Varies by lead status, how long the lead has been sitting,
 * and whether it's tagged VIP, so it's more useful than one generic
 * template, while staying honest about not being "real" AI.
 */
function composeOfflineMessage(context: LeadAiContext): string {
  const isVip = context.tags.some((t) => t.toLowerCase().includes('vip') || t === 'ساخن');
  const stale = context.daysSinceCreated >= 3;

  const openers: Record<string, string> = {
    new: `مرحبًا ${context.fullName}، شكرًا لتواصلك معنا! يسعدنا معرفة المزيد عن احتياجك لنقدّم لك أفضل عرض مناسب.`,
    contacted: `مرحبًا ${context.fullName}، نتابع معك بخصوص تواصلنا السابق — هل ما زلت مهتمًا؟ يسعدنا الإجابة عن أي استفسار.`,
    interested: `مرحبًا ${context.fullName}، يسعدنا اهتمامك بخدماتنا! هل تحتاج أي معلومات إضافية لاتخاذ قرارك؟`,
    negotiating: `مرحبًا ${context.fullName}، نتابع معك لإنهاء التفاصيل الأخيرة — هل يمكننا تأكيد الاتفاق معك اليوم؟`,
    won: `مرحبًا ${context.fullName}، شكرًا لثقتك بنا! نحن هنا لأي مساعدة إضافية قد تحتاجها.`,
    lost: `مرحبًا ${context.fullName}، نتمنى أن تكون قد وجدت ما يناسبك. باب التواصل معنا مفتوح دائمًا إن احتجت شيئًا مستقبلًا.`,
  };

  let message = openers[context.status] ?? openers.new;

  if (stale && ['new', 'contacted', 'interested'].includes(context.status)) {
    message += ' لاحظنا أنه مضى بعض الوقت منذ آخر تواصل — تواصل معنا بأي وقت يناسبك.';
  }
  if (isVip) {
    message = `عميلنا العزيز، ${message}`;
  }

  return message;
}

/**
 * Drafts a short, ready-to-send follow-up message for one lead in
 * Arabic, grounded only in real data already in the CRM (status, tags,
 * notes) — never invents facts about the customer. Always returns a
 * usable message: tries the free hosted AI first, falls back to the
 * offline composer if no key is configured or the request fails.
 */
export async function suggestFollowUpMessage(
  context: LeadAiContext
): Promise<{ message: string; source: AiSource }> {
  const notesBlock = context.recentNotes.length > 0
    ? context.recentNotes.map((n, i) => `${i + 1}. ${n}`).join('\n')
    : '(لا توجد ملاحظات مسجلة)';

  const hosted = await generateWithHostedAi({
    system:
      'أنت مساعد لفريق مبيعات يكتب رسائل متابعة قصيرة باللهجة العربية الفصحى المبسطة، مناسبة لإرسالها عبر واتساب. ' +
      'اكتب رسالة واحدة فقط، ودودة ومباشرة، بدون مقدمات أو شرح، لا تتجاوز 3-4 جمل. ' +
      'لا تخترع أي معلومة عن العميل غير المذكورة في البيانات المعطاة.',
    prompt:
      `اسم العميل المحتمل: ${context.fullName}\n` +
      `الحالة الحالية: ${context.statusLabel}\n` +
      `الوسوم: ${context.tags.join('، ') || 'بدون'}\n` +
      `منذ إضافته: ${context.daysSinceCreated} يومًا\n` +
      `آخر الملاحظات:\n${notesBlock}\n\n` +
      'اكتب رسالة متابعة مناسبة لإرسالها لهذا العميل الآن.',
    maxTokens: 200,
  });

  if (hosted) return { message: hosted.text, source: hosted.source };

  return { message: composeOfflineMessage(context), source: 'offline' };
}

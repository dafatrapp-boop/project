import type { Section } from './types';

export interface Template {
  id: string;
  label: string;
  hint: string;
  sections: Section[];
}

/**
 * Section order follows standard high-converting SaaS/landing-page
 * structure: Hero (grab attention) -> Social proof (build trust early,
 * before asking for anything) -> Features (explain the value) -> Form
 * (capture the lead while interest is highest) -> FAQ (handle
 * objections that stop a hesitant visitor) -> CTA (final push) ->
 * Footer.
 *
 * Every template now includes a real `form` section — previously none
 * did (only hero/cta buttons, both of which just open WhatsApp
 * directly). That meant a page built from any of these templates
 * never actually wrote a row into `leads`: a visitor could message the
 * business on WhatsApp, but the CRM had no record of them at all. This
 * was the single most important fix in this pass — a landing page
 * whose templates don't reliably capture leads defeats the product's
 * core purpose.
 */
/**
 * Every workspace industry (9 values, `workspace_industry` enum) maps
 * to its closest starter template. Previously only 6 of 9 industries
 * had a matching template id, so `beauty_salon`, `lawyer`, and
 * `consultant` silently fell back to whatever `TEMPLATES` happened to
 * end with — this makes that mapping explicit and picks the nearest
 * real analog instead of a blind fallback.
 */
export const INDUSTRY_TEMPLATE_MAP: Record<string, string> = {
  clinic: 'clinic',
  beauty_salon: 'clinic', // appointment/booking-based service business, same shape
  real_estate: 'real_estate',
  training_center: 'training_center',
  lawyer: 'general',
  consultant: 'general',
  instagram_store: 'instagram_store',
  restaurant: 'restaurant',
  other: 'general',
};

export const TEMPLATES: Template[] = [
  {
    id: 'clinic',
    label: 'عيادة / مركز طبي',
    hint: 'حجز موعد مباشر عبر واتساب',
    sections: [
      {
        type: 'hero',
        headline: 'ابتسامتك تستحق أفضل رعاية',
        subheadline: 'احجز موعدك الآن مع فريقنا الطبي المتخصص',
        ctaLabel: 'احجز موعدك عبر واتساب',
      },
      {
        type: 'social_proof',
        stats: [
          { value: '+2000', label: 'مريض تمت رعايته' },
          { value: '4.9/5', label: 'تقييم المرضى' },
          { value: '+8', label: 'سنوات خبرة' },
        ],
      },
      {
        type: 'features',
        title: 'لماذا تختار عيادتنا',
        items: [
          { title: 'أطباء متخصصون', description: 'فريق طبي معتمد وذو خبرة' },
          { title: 'أحدث الأجهزة', description: 'تقنيات علاج متطورة' },
          { title: 'مواعيد مرنة', description: 'نتناسب مع جدولك اليومي' },
        ],
      },
      {
        type: 'form',
        title: 'احجز موعدك الآن',
        description: 'اترك بياناتك وسيتواصل معك فريقنا لتأكيد أقرب موعد متاح',
        submitLabel: 'إرسال طلب الحجز',
        whatsappMessageTemplate: 'مرحبًا، أنا {name} وأرغب بحجز موعد.',
      },
      // Clinics default to appointment_settings.enabled = true (see
      // industry_defaults_to_appointments() in 0016_appointments.sql)
      // — the page itself should offer real slot-booking by default
      // too, not just a plain contact form, so this doesn't sit unused
      // until the merchant discovers and adds it manually.
      {
        type: 'appointment_booking',
        title: 'احجز موعدك الآن',
        description: 'اختر اليوم والوقت المناسب لك وسنؤكد حجزك فورًا',
        submitLabel: 'تأكيد الحجز',
      },
      {
        type: 'faq',
        title: 'أسئلة شائعة',
        items: [
          { question: 'هل يمكن الحجز في نفس اليوم؟', answer: 'نعم، تواصل معنا وسنوفر لك أقرب موعد متاح حسب الجدول.' },
          { question: 'هل تقبلون التأمين الصحي؟', answer: 'تواصل معنا لمعرفة شركات التأمين المعتمدة لدينا.' },
        ],
      },
      { type: 'cta', headline: 'لا تؤجل ابتسامتك', buttonLabel: 'احجز الآن' },
      { type: 'footer', text: '© جميع الحقوق محفوظة' },
    ],
  },
  {
    id: 'real_estate',
    label: 'عقارات',
    hint: 'عرض وحدة أو مشروع عقاري',
    sections: [
      {
        type: 'hero',
        headline: 'منزل أحلامك بانتظارك',
        subheadline: 'شقق وفلل بمواصفات عالية وموقع مميز',
        ctaLabel: 'استفسر عبر واتساب',
      },
      {
        type: 'social_proof',
        stats: [
          { value: '+150', label: 'وحدة مباعة' },
          { value: '+300', label: 'عميل راضٍ' },
          { value: '5', label: 'مشاريع منجزة' },
        ],
      },
      {
        type: 'features',
        title: 'مميزات المشروع',
        items: [
          { title: 'موقع استراتيجي', description: 'قريب من الخدمات الرئيسية' },
          { title: 'تشطيبات فاخرة', description: 'جودة عالية في كل تفصيلة' },
          { title: 'تسهيلات في السداد', description: 'خطط دفع مرنة' },
        ],
      },
      {
        type: 'form',
        title: 'اطلب كتالوج الوحدات وأسعارها',
        description: 'اترك بياناتك وسيتواصل معك مستشار العقار خلال دقائق',
        submitLabel: 'إرسال الطلب',
        whatsappMessageTemplate: 'مرحبًا، أنا {name} وأرغب بمعرفة تفاصيل الوحدات المتاحة.',
      },
      {
        type: 'faq',
        title: 'أسئلة شائعة',
        items: [
          { question: 'هل تتوفر خطط تقسيط؟', answer: 'نعم، لدينا خطط سداد مرنة تناسب احتياجك — تواصل معنا للتفاصيل.' },
          { question: 'متى موعد التسليم؟', answer: 'يختلف حسب المشروع، تواصل معنا لمعرفة موعد التسليم الدقيق.' },
        ],
      },
      { type: 'cta', headline: 'الوحدات محدودة', buttonLabel: 'تواصل الآن' },
      { type: 'footer', text: '© جميع الحقوق محفوظة' },
    ],
  },
  {
    id: 'training_center',
    label: 'مركز تدريب',
    hint: 'دورة أو برنامج تدريبي',
    sections: [
      {
        type: 'hero',
        headline: 'طوّر مهاراتك مع خبراء المجال',
        subheadline: 'دورات عملية تؤهلك لسوق العمل',
        ctaLabel: 'سجّل عبر واتساب',
      },
      {
        type: 'social_proof',
        stats: [
          { value: '+1200', label: 'متدرب مُتخرّج' },
          { value: '4.8/5', label: 'تقييم المتدربين' },
          { value: '+90%', label: 'نسبة الرضا' },
        ],
      },
      {
        type: 'features',
        title: 'ماذا ستتعلم',
        items: [
          { title: 'محتوى محدث', description: 'مواكب لأحدث المهارات المطلوبة' },
          { title: 'مدربون معتمدون', description: 'خبرة عملية حقيقية' },
          { title: 'شهادة معتمدة', description: 'تُضاف إلى سيرتك الذاتية' },
        ],
      },
      {
        type: 'form',
        title: 'احجز مقعدك في الدورة',
        description: 'اترك بياناتك وسنرسل لك تفاصيل الدورة القادمة وموعدها',
        submitLabel: 'التسجيل الآن',
        whatsappMessageTemplate: 'مرحبًا، أنا {name} وأرغب بالتسجيل في الدورة.',
      },
      {
        type: 'appointment_booking',
        title: 'احجز جلستك التعريفية',
        description: 'اختر اليوم والوقت المناسب لك وسنؤكد حجزك فورًا',
        submitLabel: 'تأكيد الحجز',
      },
      {
        type: 'faq',
        title: 'أسئلة شائعة',
        items: [
          { question: 'هل الدورة حضورية أم أونلاين؟', answer: 'تواصل معنا لمعرفة تفاصيل الدورة القادمة ونظام الحضور.' },
          { question: 'هل أحصل على شهادة معتمدة؟', answer: 'نعم، تحصل على شهادة إتمام معتمدة بعد إنهاء الدورة.' },
        ],
      },
      { type: 'cta', headline: 'المقاعد محدودة', buttonLabel: 'احجز مقعدك' },
      { type: 'footer', text: '© جميع الحقوق محفوظة' },
    ],
  },
  {
    id: 'instagram_store',
    label: 'متجر انستغرام',
    hint: 'عرض منتج أو مجموعة',
    sections: [
      {
        type: 'hero',
        headline: 'تسوّقي أحدث تشكيلاتنا',
        subheadline: 'جودة عالية وتوصيل سريع لجميع المناطق',
        ctaLabel: 'اطلبي عبر واتساب',
      },
      {
        type: 'social_proof',
        stats: [
          { value: '+5000', label: 'طلب تم تسليمه' },
          { value: '4.9/5', label: 'تقييم العميلات' },
          { value: '24 ساعة', label: 'سرعة التوصيل' },
        ],
      },
      {
        type: 'features',
        title: 'لماذا تتسوقين معنا',
        items: [
          { title: 'خامات فاخرة', description: 'منتجات مختارة بعناية' },
          { title: 'توصيل سريع', description: 'خلال أيام قليلة' },
          { title: 'إمكانية الاستبدال', description: 'رضاكِ يهمنا' },
        ],
      },
      {
        type: 'form',
        title: 'اطلبي الآن',
        description: 'اتركي بياناتك وسنؤكد طلبك عبر واتساب فورًا',
        submitLabel: 'تأكيد الطلب',
        whatsappMessageTemplate: 'مرحبًا، أنا {name} وأرغب بطلب المنتج المعروض.',
      },
      {
        type: 'faq',
        title: 'أسئلة شائعة',
        items: [
          { question: 'كم مدة التوصيل؟', answer: 'عادة خلال 1-3 أيام حسب منطقتك — تواصلي معنا للتأكيد.' },
          { question: 'هل يمكن الاستبدال أو الإرجاع؟', answer: 'نعم، نوفر إمكانية الاستبدال خلال فترة محددة — تواصلي معنا للتفاصيل.' },
        ],
      },
      { type: 'cta', headline: 'الكمية محدودة', buttonLabel: 'اطلبي الآن' },
      { type: 'footer', text: '© جميع الحقوق محفوظة' },
    ],
  },
  {
    id: 'restaurant',
    label: 'مطعم',
    hint: 'طلبات أونلاين عبر السوشيال ميديا',
    sections: [
      {
        type: 'hero',
        headline: 'طعم أصيل يصلك أينما كنت',
        subheadline: 'اطلب الآن واستمتع بأشهى الأطباق',
        ctaLabel: 'اطلب عبر واتساب',
      },
      {
        type: 'social_proof',
        stats: [
          { value: '+10000', label: 'طلب سعيد' },
          { value: '4.7/5', label: 'تقييم الزبائن' },
          { value: '30 دقيقة', label: 'متوسط التوصيل' },
        ],
      },
      {
        type: 'features',
        title: 'لماذا تطلب منا',
        items: [
          { title: 'مكونات طازجة', description: 'نختار الأفضل يوميًا' },
          { title: 'توصيل سريع', description: 'طلبك يصلك ساخنًا' },
          { title: 'عروض يومية', description: 'أسعار مميزة كل يوم' },
        ],
      },
      {
        type: 'form',
        title: 'اطلب وجبتك الآن',
        description: 'اترك بياناتك وسنؤكد طلبك عبر واتساب فورًا',
        submitLabel: 'إرسال الطلب',
        whatsappMessageTemplate: 'مرحبًا، أنا {name} وأرغب بطلب وجبة.',
      },
      {
        type: 'faq',
        title: 'أسئلة شائعة',
        items: [
          { question: 'ما مناطق التوصيل المتاحة؟', answer: 'نغطي معظم المناطق القريبة — تواصل معنا للتأكد من منطقتك.' },
          { question: 'هل تتوفر عروض للطلبات الكبيرة؟', answer: 'نعم، تواصل معنا لمعرفة عروض المناسبات والطلبات الكبيرة.' },
        ],
      },
      { type: 'cta', headline: 'جائع الآن؟', buttonLabel: 'اطلب وجبتك' },
      { type: 'footer', text: '© جميع الحقوق محفوظة' },
    ],
  },
  {
    id: 'general',
    label: 'قالب عام',
    hint: 'مناسب لأي نشاط تجاري',
    sections: [
      {
        type: 'hero',
        headline: 'عنوان رئيسي جذاب لنشاطك',
        subheadline: 'وصف مختصر لما تقدمه لعملائك',
        ctaLabel: 'تواصل معنا عبر واتساب',
      },
      {
        type: 'social_proof',
        stats: [
          { value: '+500', label: 'عميل راضٍ' },
          { value: '4.9/5', label: 'تقييم العملاء' },
          { value: '+3', label: 'سنوات خبرة' },
        ],
      },
      {
        type: 'features',
        title: 'لماذا تختارنا',
        items: [
          { title: 'خبرة موثوقة', description: 'سنوات من العمل مع عملاء راضين' },
          { title: 'استجابة سريعة', description: 'نرد على استفسارك خلال دقائق' },
          { title: 'خدمة مخصصة', description: 'نتعامل مع كل عميل حسب احتياجه' },
        ],
      },
      {
        type: 'form',
        title: 'اطلب الآن',
        description: 'املأ بياناتك وسنتواصل معك عبر واتساب فورًا',
        submitLabel: 'إرسال عبر واتساب',
        whatsappMessageTemplate: 'مرحبًا، أنا {name} وأرغب بالاستفسار عن خدماتكم.',
      },
      {
        type: 'faq',
        title: 'أسئلة شائعة',
        items: [
          { question: 'كيف أطلب أو أستفسر؟', answer: 'اضغط على أي زر تواصل في الصفحة وسنرد عليك مباشرة عبر واتساب.' },
          { question: 'هل يوجد ضمان؟', answer: 'رضاكم هو أولويتنا — تواصل معنا لمعرفة تفاصيل الضمان.' },
        ],
      },
      { type: 'cta', headline: 'جاهز للبدء؟', buttonLabel: 'تواصل الآن' },
      { type: 'footer', text: '© جميع الحقوق محفوظة' },
    ],
  },
];

export function getTemplateForIndustry(industry: string): Template {
  const templateId = INDUSTRY_TEMPLATE_MAP[industry] ?? 'general';
  return TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[TEMPLATES.length - 1];
}

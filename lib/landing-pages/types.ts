export type Section =
  | { type: 'hero'; headline: string; subheadline: string; ctaLabel: string; imageUrl?: string }
  | { type: 'features'; title: string; items: { title: string; description: string; imageUrl?: string }[] }
  | { type: 'social_proof'; stats: { value: string; label: string }[] }
  | { type: 'cta'; headline: string; buttonLabel: string }
  | {
      type: 'form';
      title: string;
      description: string;
      submitLabel: string;
      whatsappMessageTemplate: string;
    }
  | { type: 'testimonials'; title: string }
  | { type: 'appointment_booking'; title: string; description: string; submitLabel: string }
  | { type: 'faq'; title: string; items: { question: string; answer: string }[] }
  | { type: 'footer'; text: string };

export const SECTION_TYPE_LABELS: Record<Section['type'], string> = {
  hero: 'قسم رئيسي (Hero)',
  features: 'قسم المزايا',
  social_proof: 'أرقام وثقة (Social Proof)',
  cta: 'دعوة لاتخاذ إجراء',
  form: 'نموذج طلب / تواصل',
  testimonials: 'آراء العملاء',
  appointment_booking: 'حجز المواعيد',
  faq: 'أسئلة شائعة',
  footer: 'تذييل الصفحة',
};

export function createDefaultSection(type: Section['type']): Section {
  switch (type) {
    case 'hero':
      return {
        type: 'hero',
        headline: 'عنوان رئيسي جذاب',
        subheadline: 'وصف قصير يشرح ما تقدمه',
        ctaLabel: 'تواصل معنا عبر واتساب',
      };
    case 'features':
      return {
        type: 'features',
        title: 'لماذا تختارنا',
        items: [
          { title: 'ميزة أولى', description: 'وصف مختصر للميزة' },
          { title: 'ميزة ثانية', description: 'وصف مختصر للميزة' },
        ],
      };
    case 'social_proof':
      return {
        type: 'social_proof',
        stats: [
          { value: '+500', label: 'عميل راضٍ' },
          { value: '4.9/5', label: 'تقييم العملاء' },
          { value: '+3', label: 'سنوات خبرة' },
        ],
      };
    case 'cta':
      return { type: 'cta', headline: 'جاهز للبدء؟', buttonLabel: 'احجز الآن' };
    case 'form':
      return {
        type: 'form',
        title: 'اطلب الآن',
        description: 'املأ بياناتك وسنتواصل معك عبر واتساب فورًا',
        submitLabel: 'إرسال عبر واتساب',
        whatsappMessageTemplate: 'مرحبًا، أنا {name} وأرغب بالاستفسار عن خدماتكم.',
      };
    case 'testimonials':
      return { type: 'testimonials', title: 'ماذا يقول عملاؤنا' };
    case 'appointment_booking':
      return {
        type: 'appointment_booking',
        title: 'احجز موعدك الآن',
        description: 'اختر اليوم والوقت المناسب لك وسنؤكد حجزك',
        submitLabel: 'تأكيد الحجز',
      };
    case 'faq':
      return {
        type: 'faq',
        title: 'أسئلة شائعة',
        items: [
          { question: 'كيف أطلب أو أحجز؟', answer: 'اضغط على أي زر تواصل في الصفحة وسنرد عليك مباشرة عبر واتساب.' },
          { question: 'هل يوجد ضمان؟', answer: 'نعم، رضاكم هو أولويتنا ونوفر ضمانًا على خدماتنا.' },
        ],
      };
    case 'footer':
      return { type: 'footer', text: '© جميع الحقوق محفوظة' };
  }
}

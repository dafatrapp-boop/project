import type { Section } from './types';

export interface Template {
  id: string;
  label: string;
  hint: string;
  sections: Section[];
}

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
        type: 'features',
        title: 'لماذا تختار عيادتنا',
        items: [
          { title: 'أطباء متخصصون', description: 'فريق طبي معتمد وذو خبرة' },
          { title: 'أحدث الأجهزة', description: 'تقنيات علاج متطورة' },
          { title: 'مواعيد مرنة', description: 'نتناسب مع جدولك اليومي' },
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
        type: 'features',
        title: 'مميزات المشروع',
        items: [
          { title: 'موقع استراتيجي', description: 'قريب من الخدمات الرئيسية' },
          { title: 'تشطيبات فاخرة', description: 'جودة عالية في كل تفصيلة' },
          { title: 'تسهيلات في السداد', description: 'خطط دفع مرنة' },
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
        type: 'features',
        title: 'ماذا ستتعلم',
        items: [
          { title: 'محتوى محدث', description: 'مواكب لأحدث المهارات المطلوبة' },
          { title: 'مدربون معتمدون', description: 'خبرة عملية حقيقية' },
          { title: 'شهادة معتمدة', description: 'تُضاف إلى سيرتك الذاتية' },
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
        type: 'features',
        title: 'لماذا تتسوقين معنا',
        items: [
          { title: 'خامات فاخرة', description: 'منتجات مختارة بعناية' },
          { title: 'توصيل سريع', description: 'خلال أيام قليلة' },
          { title: 'إمكانية الاستبدال', description: 'رضاكِ يهمنا' },
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
        type: 'features',
        title: 'لماذا تطلب منا',
        items: [
          { title: 'مكونات طازجة', description: 'نختار الأفضل يوميًا' },
          { title: 'توصيل سريع', description: 'طلبك يصلك ساخنًا' },
          { title: 'عروض يومية', description: 'أسعار مميزة كل يوم' },
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
        type: 'features',
        title: 'لماذا تختارنا',
        items: [
          { title: 'ميزة أولى', description: 'وصف مختصر' },
          { title: 'ميزة ثانية', description: 'وصف مختصر' },
        ],
      },
      { type: 'cta', headline: 'جاهز للبدء؟', buttonLabel: 'تواصل الآن' },
      { type: 'footer', text: '© جميع الحقوق محفوظة' },
    ],
  },
];

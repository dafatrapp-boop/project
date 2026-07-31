export interface GuideStep {
  title: string;
  body: string;
}

export interface PageGuideContent {
  title: string;
  steps: GuideStep[];
}

export const DASHBOARD_GUIDE: PageGuideContent = {
  title: 'نظرة عامة',
  steps: [
    {
      title: 'مؤشراتك اليومية',
      body: 'تعرض البطاقات أعلى الصفحة أداء اليوم: عملاء جدد، نسبة التحويل، أفضل حملة، وعدد الصفقات المكتملة.',
    },
    {
      title: 'المتابعات والنشاط',
      body: 'يذكّرك القسم السفلي بالمتابعات المستحقة، ويعرض آخر التحديثات على عملائك وصفحاتك.',
    },
  ],
};

export const LEADS_GUIDE: PageGuideContent = {
  title: 'العملاء المحتملون',
  steps: [
    {
      title: 'إضافة عميل وتغيير حالته',
      body: 'أضف عميلًا يدويًا بزر "إضافة"، وحدّث حالته (جديد، تم التواصل، مهتم...) من صفحة العميل مباشرة.',
    },
    {
      title: 'الفرز والبحث',
      body: 'استخدم الفلاتر والوسوم لتضييق القائمة على العملاء الأهم بالنسبة لك الآن.',
    },
  ],
};

export const PIPELINE_GUIDE: PageGuideContent = {
  title: 'مراحل البيع',
  steps: [
    {
      title: 'اسحب العميل بين المراحل',
      body: 'اسحب بطاقة العميل من عمود إلى آخر لتحديث حالته فورًا — من "جديد" حتى "تم البيع".',
    },
  ],
};

export const LANDING_PAGES_GUIDE: PageGuideContent = {
  title: 'صفحات الهبوط',
  steps: [
    {
      title: 'إنشاء وتعديل صفحة',
      body: 'أنشئ صفحة من قالب جاهز، ثم عدّل الأقسام والنصوص والصور من المحرر.',
    },
    {
      title: 'النشر',
      body: 'الصفحة تبقى مسودة حتى تنشرها — بعد النشر تصبح متاحة للزوار على رابط عام.',
    },
  ],
};

export const TEMPLATES_GUIDE: PageGuideContent = {
  title: 'القوالب',
  steps: [
    {
      title: 'اختيار قالب مناسب',
      body: 'اختر القالب الأقرب لنوع نشاطك، ثم خصص كل شيء بداخله من محرر الصفحة بعد إنشائها.',
    },
  ],
};

export const CAMPAIGNS_GUIDE: PageGuideContent = {
  title: 'الحملات',
  steps: [
    {
      title: 'ربط الحملة بصفحة هبوط',
      body: 'أنشئ حملة واربطها بإحدى صفحاتك، وسنولّد لها رابط تتبع (UTM) تلقائيًا لقياس أدائها.',
    },
  ],
};

export const ANALYTICS_GUIDE: PageGuideContent = {
  title: 'التحليلات',
  steps: [
    {
      title: 'قراءة التقارير',
      body: 'تابع الزيارات والعملاء المحتملين ومعدلات التحويل يوميًا، وقارن أداء حملاتك المختلفة.',
    },
  ],
};

export const ORDERS_GUIDE: PageGuideContent = {
  title: 'الطلبات',
  steps: [
    {
      title: 'إضافة وإدارة الطلبات',
      body: 'أضف طلبًا بزر "طلب جديد"، حدد المنتج والسعر وطريقة الدفع، وتابع حالته حتى التسليم.',
    },
  ],
};

export const APPOINTMENTS_GUIDE: PageGuideContent = {
  title: 'المواعيد',
  steps: [
    {
      title: 'إدارة الحجوزات',
      body: 'تظهر هنا كل المواعيد المحجوزة من صفحتك أو المضافة يدويًا. أكّد الموعد أو ألغه من هذه الصفحة.',
    },
    {
      title: 'إعدادات المواعيد',
      body: 'تحكم بأيام العمل وساعاته ومدة كل موعد من الإعدادات.',
    },
  ],
};

export const TESTIMONIALS_GUIDE: PageGuideContent = {
  title: 'آراء العملاء',
  steps: [
    {
      title: 'إضافة شهادة',
      body: 'أضف اسم العميل وتقييمه ونص الشهادة، وصورته إن وجدت — لا حاجة لأي حساب من طرف العميل.',
    },
    {
      title: 'الإظهار في صفحتك',
      body: 'أضف قسم "آراء العملاء" لأي صفحة هبوط من محرر الصفحة ليظهر بتصميم Slider احترافي.',
    },
  ],
};

export const AUTOMATIONS_GUIDE: PageGuideContent = {
  title: 'الأتمتة',
  steps: [
    {
      title: 'قواعد جاهزة وبسيطة',
      body: 'فعّل أي قاعدة جاهزة (تذكير، متابعة، وسم تلقائي) واضبط رقمها فقط — بلا تعقيد.',
    },
  ],
};

export const SETTINGS_GUIDE: PageGuideContent = {
  title: 'الإعدادات',
  steps: [
    {
      title: 'أهم الإعدادات',
      body: 'من هنا تتحكم بـ Meta Pixel وإعدادات المواعيد، ويمكنك إعادة تفعيل إرشادات الصفحات في أي وقت.',
    },
  ],
};

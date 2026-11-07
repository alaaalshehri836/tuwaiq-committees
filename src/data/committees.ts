import { Handshake, HeartPulse, Megaphone, Trophy, UsersRound, type LucideIcon } from 'lucide-react';
import type { CommitteeId } from '../types';
import { ACCENTS } from '../theme/palette';

export interface Committee {
  id: CommitteeId;
  /** Display order (1-based) — also the number shown on the door. */
  order: number;
  name: string;
  /** Short line shown on hover and under the title. */
  tagline: string;
  description: string;
  responsibilities: string[];
  accent: string;
  icon: LucideIcon;
  /**
   * 5×5 pixel glyph engraved on the committee door ("1" = lit pixel).
   * Gives every door its own pixel identity.
   */
  pattern: string[];
}

/**
 * ============================================================
 *  بيانات اللجان — Committee content
 * ============================================================
 *  ✏️ النصوص أدناه مقترحة (مسودة) — عدّل الأسماء والأوصاف والمهام
 *  كما تريد. ترتيب العناصر هنا هو ترتيب الأبواب في الموقع.
 *
 *  Draft copy — edit names, descriptions and responsibilities freely.
 *  The array order is the order of the doors.
 * ============================================================
 */
export const COMMITTEES: Committee[] = [
  {
    id: 'media',
    order: 1,
    name: 'اللجنة الإعلامية',
    tagline: 'صوت النادي وصورته',
    description:
      'تصنع حضور نادي طويق الرقمي، وتحوّل فعالياته وإنجازاته إلى محتوى بصري وقصصي يصل إلى مجتمع الجامعة وما بعده.',
    responsibilities: [
      'إدارة حسابات النادي على منصات التواصل الاجتماعي',
      'تصميم الهوية البصرية للفعاليات والمنشورات',
      'التصوير وصناعة المحتوى المرئي وتغطية الفعاليات',
      'كتابة المحتوى والإعلانات بأسلوب يعكس هوية النادي',
    ],
    accent: ACCENTS.electricPurple,
    icon: Megaphone,
    pattern: ['00110', '01110', '11110', '01110', '00110'],
  },
  {
    id: 'hr',
    order: 2,
    name: 'لجنة الموارد البشرية',
    tagline: 'قوة الفريق تبدأ بأفراده',
    description:
      'تبني فريقًا متماسكًا ومتحفّزًا، وتعتني بأعضاء النادي من لحظة انضمامهم حتى يصنعوا أثرهم.',
    responsibilities: [
      'استقطاب الأعضاء الجدد وتنظيم التسجيل والمقابلات',
      'متابعة أداء الأعضاء وتوثيق ساعات التطوع',
      'تنظيم برامج التهيئة وتطوير مهارات الأعضاء',
      'تعزيز التواصل الداخلي والتنسيق بين اللجان',
    ],
    accent: ACCENTS.cyanBlue,
    icon: UsersRound,
    pattern: ['01010', '11111', '01010', '11111', '01010'],
  },
  {
    id: 'quality-of-life',
    order: 3,
    name: 'لجنة جودة الحياة',
    tagline: 'قلب الفريق ونبضه',
    description:
      'تصنع لحظات تُثري تجربة الأعضاء والطلاب، وتوازن بين الإنجاز والراحة داخل مجتمع النادي.',
    responsibilities: [
      'تنظيم اللقاءات الاجتماعية والأنشطة الترفيهية',
      'إطلاق مبادرات تعزز الصحة النفسية والتوازن',
      'الاحتفاء بإنجازات الأعضاء ومناسبات النادي',
      'قياس رضا الأعضاء واقتراح تحسينات لتجربتهم',
    ],
    accent: ACCENTS.lavender,
    icon: HeartPulse,
    pattern: ['01010', '11111', '11111', '01110', '00100'],
  },
  {
    id: 'sports',
    order: 4,
    name: 'لجنة الأنشطة الرياضية والمسابقات',
    tagline: 'روح المنافسة والتحدي',
    description:
      'تُشعل روح المنافسة عبر بطولات ومسابقات رياضية وتقنية تجمع الطلاب وتُطلق طاقاتهم.',
    responsibilities: [
      'تنظيم البطولات والأنشطة الرياضية',
      'إعداد المسابقات والتحديات التقنية',
      'إدارة جداول المنافسات والتحكيم والجوائز',
      'التنسيق مع الجهات الجامعية لتوفير المرافق',
    ],
    accent: ACCENTS.turquoise,
    icon: Trophy,
    pattern: ['11111', '11111', '01110', '00100', '01110'],
  },
  {
    id: 'relations',
    order: 5,
    name: 'لجنة العلاقات والشراكات',
    tagline: 'جسور تصنع الفرص',
    description:
      'تمدّ جسور التعاون بين النادي والجهات الأكاديمية والتقنية، لتفتح للأعضاء أبوابًا جديدة من الفرص.',
    responsibilities: [
      'بناء الشراكات مع الجهات والشركات التقنية',
      'التواصل مع المتحدثين والخبراء لاستضافتهم',
      'إعداد خطابات التعاون وعروض الرعاية',
      'متابعة العلاقات مع الشركاء وتوثيقها',
    ],
    accent: ACCENTS.warmOrange,
    icon: Handshake,
    pattern: ['10001', '11011', '01110', '11011', '10001'],
  },
];

export const getCommittee = (id: string) => COMMITTEES.find((c) => c.id === id);

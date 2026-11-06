/**
 * ============================================================
 *  VIDEO SCRIPT — every on-screen text + scene timing.
 *  Edit here, then re-render with:  npm run render:video
 * ============================================================
 */

export const VIDEO = { width: 1920, height: 1080, fps: 30 } as const;

export const TEXT = {
  // Scene 1 — Entrance
  kicker: 'نادي طويق بجامعة أم القرى',
  headline: 'فتح التسجيل في اللجان الإدارية',
  subline: 'اكتشف الفرص التي تنتظرك في طويق',
  // Scene 2/3 — Hall
  hallKicker: 'اللجان الإدارية',
  hallTitle: 'خمسة أبواب.. خمس لجان',
  // Scene 4 — Finale
  paths: 'خمسة مسارات، وفرص متعددة للمساهمة',
  join: 'كن جزءًا من طويق',
  open: 'التسجيل مفتوح الآن',
  cta: 'اختر لجنتك وابدأ رحلتك معنا',
  // Branding
  club: 'نادي طويق',
  university: 'جامعة أم القرى',
  deanship: 'عمادة شؤون الطلاب',
} as const;

/**
 * Optional official logo files. Put the images in /public and set the
 * paths, e.g. uquLogo: './brand/uqu-logo.png'. Empty = text branding.
 */
export const BRAND = {
  tuwaiqLogo: '',
  uquLogo: '',
};

/**
 * Length (seconds) of each block of the story, in order.
 * The total video length is the sum (≈ 47.7 s by default).
 * Fine-grained offsets inside a block live in masterTimeline.ts.
 */
export const DURATIONS = {
  entrance: 9.2, // dark → door → headline → subline → door glows
  doorOpen: 1.6, // leaves swing open, light pours out
  cameraPush: 2.4, // camera flies through the doorway
  hallReveal: 3.8, // land in the hall, five doors rise
  perCommittee: 2.9, // highlight of EACH committee (×5)
  pullBack: 1.8, // camera returns to the full composition
  paths: 3.2, // «خمسة مسارات، وفرص متعددة للمساهمة»
  join: 3.0, // «كن جزءًا من طويق»
  open: 2.8, // «التسجيل مفتوح الآن»
  endCard: 5.9, // branding + CTA (last 0.7 s fades to black)
};

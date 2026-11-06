import type { CommitteeId } from '../types';

/**
 * ============================================================
 *  روابط التسجيل — Registration form URLs
 * ============================================================
 *  ⚠️ هذه روابط مؤقتة (Placeholder). استبدل كل رابط برابط نموذج
 *  التسجيل الفعلي للجنة (Google Forms / Microsoft Forms / ...).
 *
 *  Replace every URL below with the real registration form link.
 *  While a URL still contains "REPLACE-ME", a warning is printed in
 *  the browser console and a hint appears on the page in dev mode.
 * ============================================================
 */
export const REGISTRATION_URLS: Record<CommitteeId, string> = {
  media: 'https://example.com/REPLACE-ME/media-committee-form',
  hr: 'https://example.com/REPLACE-ME/hr-committee-form',
  'quality-of-life': 'https://example.com/REPLACE-ME/quality-of-life-committee-form',
  sports: 'https://example.com/REPLACE-ME/sports-committee-form',
  relations: 'https://example.com/REPLACE-ME/relations-committee-form',
};

export const isPlaceholderUrl = (url: string) => url.includes('REPLACE-ME');

export const getRegistrationUrl = (id: CommitteeId) => REGISTRATION_URLS[id];

const pending = (Object.keys(REGISTRATION_URLS) as CommitteeId[]).filter((id) =>
  isPlaceholderUrl(REGISTRATION_URLS[id]),
);
if (pending.length) {
  console.warn(
    `[Tuwaiq] Registration URLs still use placeholders for: ${pending.join(', ')}. ` +
      'Edit src/config/registration.ts',
  );
}

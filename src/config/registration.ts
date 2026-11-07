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
/** Official registration form (one form for all committees). */
const REGISTRATION_FORM_URL =
  'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=-1egedWw3USPkAv3FR9cPzBy_Z29aVlAl8BB1IXwxONUQks0WkQxOUxYMlA0WlVNMFM0WUZYNUg0SC4u';

export const REGISTRATION_URLS: Record<CommitteeId, string> = {
  media: REGISTRATION_FORM_URL,
  hr: REGISTRATION_FORM_URL,
  'quality-of-life': REGISTRATION_FORM_URL,
  sports: REGISTRATION_FORM_URL,
  relations: REGISTRATION_FORM_URL,
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

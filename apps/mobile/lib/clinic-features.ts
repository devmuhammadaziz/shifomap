import { getApiErrorCode } from './api';

export type FeatureKind = 'reviews' | 'booking' | 'homeVisit';

/** A missing flag means the feature is on (older API responses don't send it). */
export function isFeatureOn(flag: boolean | null | undefined): boolean {
  return flag !== false;
}

const MESSAGES: Record<FeatureKind, { uz: { title: string; body: string }; ru: { title: string; body: string } }> = {
  reviews: {
    uz: {
      title: 'Sharhlar mavjud emas',
      body: "Bu klinika hozircha sharh va baholarni qabul qilmaydi.",
    },
    ru: {
      title: 'Отзывы недоступны',
      body: 'Эта клиника сейчас не принимает отзывы и оценки.',
    },
  },
  booking: {
    uz: {
      title: "Onlayn yozilish mavjud emas",
      body: "Bu klinikaga hozircha ilova orqali yozilib bo'lmaydi. Iltimos, klinikaga to'g'ridan-to'g'ri murojaat qiling.",
    },
    ru: {
      title: 'Онлайн-запись недоступна',
      body: 'Записаться в эту клинику через приложение сейчас нельзя. Пожалуйста, свяжитесь с клиникой напрямую.',
    },
  },
  homeVisit: {
    uz: {
      title: "Uyga chaqirish mavjud emas",
      body: "Bu shifokorni uyingizga chaqirib bo'lmaydi.",
    },
    ru: {
      title: 'Вызов на дом недоступен',
      body: 'Этого врача нельзя вызвать к вам на дом.',
    },
  },
};

export function featureMessage(kind: FeatureKind, language: string | null | undefined) {
  return MESSAGES[kind][language === 'ru' ? 'ru' : 'uz'];
}

const CODE_TO_KIND: Record<string, FeatureKind> = {
  REVIEWS_DISABLED: 'reviews',
  BOOKING_DISABLED: 'booking',
  HOME_VISIT_DISABLED: 'homeVisit',
};

/** If the server rejected an action because the clinic turned the feature off, returns which one. */
export function disabledFeatureFromError(err: unknown): FeatureKind | null {
  const code = getApiErrorCode(err);
  return code ? CODE_TO_KIND[code] ?? null : null;
}

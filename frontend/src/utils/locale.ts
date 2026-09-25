export type Lang = 'ar' | 'en';

export const t = (lang: Lang, ar: string, en: string) => (lang === 'ar' ? ar : en);

export const formatPrice = (amount: number, currency = 'USD', lang: Lang = 'en') => {
  try {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-IQ' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
};

export const detectLanguage = (): Lang => {
  const stored = localStorage.getItem('emenu-lang') as Lang | null;
  if (stored === 'ar' || stored === 'en') return stored;
  return 'ar';
};

/** Apply `lang` + `dir` on `<html>` (call on app/kitchen mount). */
export const applyDocumentLanguage = (lang: Lang) => {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
};

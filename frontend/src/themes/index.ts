import { getLayoutForTheme } from './layouts';

export type MenuThemeId =  | 'modern-indigo'
  | 'classic-gold'
  | 'emerald-fresh'
  | 'rose-boutique'
  | 'ocean-blue'
  | 'sunset-warm'
  | 'midnight-lounge'
  | 'minimal-mono'
  | 'arabesque'
  | 'coffee-roast';

export interface MenuTheme {
  id: MenuThemeId;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  mode: 'light' | 'dark';
  preview: [string, string, string];
  colors: {
    primary: string;
    secondary: string;
    surface: string;
    surfaceElevated: string;
    accentGold: string;
    accentWarm: string;
    text: string;
  };
  darkColors?: {
    surface: string;
    surfaceElevated: string;
    accentWarm: string;
    text: string;
  };
  fonts: {
    brand: string;
    display: string;
  };
}

export const MENU_THEMES: MenuTheme[] = [
  {
    id: 'modern-indigo',
    nameAr: 'عصري بنفسجي',
    nameEn: 'Modern Indigo',
    descAr: 'مناسب للمطاعم العصرية والكافيهات الحديثة',
    descEn: 'Perfect for modern restaurants & cafés',
    mode: 'light',
    preview: ['#818cf8', '#f8f9fc', '#fbbf24'],
    colors: {
      primary: '#6366f1',
      secondary: '#ffffff',
      surface: '#f5f6ff',
      surfaceElevated: '#ffffff',
      accentGold: '#fbbf24',
      accentWarm: '#e0e7ff',
      text: '#0f0f14',
    },
    darkColors: {
      surface: '#09090b',
      surfaceElevated: '#18181b',
      accentWarm: '#1e1b4b',
      text: '#fafafa',
    },
    fonts: { brand: "'Plus Jakarta Sans', 'Tajawal', sans-serif", display: "'DM Serif Display', serif" },
  },
  {
    id: 'classic-gold',
    nameAr: 'فاخر ذهبي',
    nameEn: 'Classic Gold',
    descAr: 'أناقة فندقية للمطاعم الراقية',
    descEn: 'Luxury hotel-style fine dining',
    mode: 'dark',
    preview: ['#d4af37', '#0a0a0a', '#1c1c1c'],
    colors: {
      primary: '#d4af37',
      secondary: '#0a0a0a',
      surface: '#0c0c0c',
      surfaceElevated: '#161616',
      accentGold: '#f0dfa0',
      accentWarm: '#2a2210',
      text: '#faf6ee',
    },
    fonts: { brand: "'Tajawal', sans-serif", display: "'Playfair Display', serif" },
  },
  {
    id: 'emerald-fresh',
    nameAr: 'أخضر طازج',
    nameEn: 'Emerald Fresh',
    descAr: 'مثالي للأكل الصحي والسلطات والعصائر',
    descEn: 'Ideal for healthy food, salads & juices',
    mode: 'light',
    preview: ['#059669', '#f0fdf4', '#34d399'],
    colors: {
      primary: '#059669',
      secondary: '#ffffff',
      surface: '#f0fdf4',
      surfaceElevated: '#ffffff',
      accentGold: '#34d399',
      accentWarm: '#d1fae5',
      text: '#064e3b',
    },
    darkColors: {
      surface: '#022c22',
      surfaceElevated: '#064e3b',
      accentWarm: '#065f46',
      text: '#ecfdf5',
    },
    fonts: { brand: "'Plus Jakarta Sans', 'Tajawal', sans-serif", display: "'DM Serif Display', serif" },
  },
  {
    id: 'rose-boutique',
    nameAr: 'وردي بوتيك',
    nameEn: 'Rose Boutique',
    descAr: 'لمقاهي الحلويات والبوتيكات الأنثوية',
    descEn: 'For dessert cafés & boutique spots',
    mode: 'light',
    preview: ['#e11d48', '#fff1f2', '#fda4af'],
    colors: {
      primary: '#e11d48',
      secondary: '#ffffff',
      surface: '#fff1f2',
      surfaceElevated: '#ffffff',
      accentGold: '#fda4af',
      accentWarm: '#ffe4e6',
      text: '#881337',
    },
    darkColors: {
      surface: '#1a0a0e',
      surfaceElevated: '#2a1018',
      accentWarm: '#4c0519',
      text: '#fff1f2',
    },
    fonts: { brand: "'Plus Jakarta Sans', 'Tajawal', sans-serif", display: "'DM Serif Display', serif" },
  },
  {
    id: 'ocean-blue',
    nameAr: 'أزرق بحري',
    nameEn: 'Ocean Blue',
    descAr: 'للمأكولات البحرية والمطاعم الساحلية',
    descEn: 'For seafood & coastal restaurants',
    mode: 'light',
    preview: ['#0284c7', '#f0f9ff', '#38bdf8'],
    colors: {
      primary: '#0284c7',
      secondary: '#ffffff',
      surface: '#f0f9ff',
      surfaceElevated: '#ffffff',
      accentGold: '#38bdf8',
      accentWarm: '#e0f2fe',
      text: '#0c4a6e',
    },
    darkColors: {
      surface: '#0c1929',
      surfaceElevated: '#0c4a6e',
      accentWarm: '#075985',
      text: '#f0f9ff',
    },
    fonts: { brand: "'Plus Jakarta Sans', 'Tajawal', sans-serif", display: "'DM Serif Display', serif" },
  },
  {
    id: 'sunset-warm',
    nameAr: 'غروب دافئ',
    nameEn: 'Sunset Warm',
    descAr: 'دفء منزلي للمطاعم العائلية والشوايات',
    descEn: 'Warm family restaurants & grills',
    mode: 'light',
    preview: ['#ea580c', '#fff7ed', '#fb923c'],
    colors: {
      primary: '#ea580c',
      secondary: '#ffffff',
      surface: '#fff7ed',
      surfaceElevated: '#ffffff',
      accentGold: '#fb923c',
      accentWarm: '#ffedd5',
      text: '#7c2d12',
    },
    darkColors: {
      surface: '#1a0f0a',
      surfaceElevated: '#2a1810',
      accentWarm: '#431407',
      text: '#fff7ed',
    },
    fonts: { brand: "'Tajawal', sans-serif", display: "'Playfair Display', serif" },
  },
  {
    id: 'midnight-lounge',
    nameAr: 'لounge ليلي',
    nameEn: 'Midnight Lounge',
    descAr: 'للصالات والكافيهات الليلية',
    descEn: 'For lounges & night cafés',
    mode: 'dark',
    preview: ['#8b5cf6', '#0f0a1a', '#a78bfa'],
    colors: {
      primary: '#8b5cf6',
      secondary: '#0f0a1a',
      surface: '#0f0a1a',
      surfaceElevated: '#1a1225',
      accentGold: '#a78bfa',
      accentWarm: '#2e1065',
      text: '#f5f3ff',
    },
    fonts: { brand: "'Plus Jakarta Sans', 'Tajawal', sans-serif", display: "'DM Serif Display', serif" },
  },
  {
    id: 'minimal-mono',
    nameAr: 'Minimal أبيض',
    nameEn: 'Minimal Mono',
    descAr: 'بساطة نظيفة للبرands العصرية',
    descEn: 'Clean simplicity for modern brands',
    mode: 'light',
    preview: ['#171717', '#fafafa', '#737373'],
    colors: {
      primary: '#171717',
      secondary: '#ffffff',
      surface: '#fafafa',
      surfaceElevated: '#ffffff',
      accentGold: '#737373',
      accentWarm: '#f5f5f5',
      text: '#171717',
    },
    darkColors: {
      surface: '#0a0a0a',
      surfaceElevated: '#171717',
      accentWarm: '#262626',
      text: '#fafafa',
    },
    fonts: { brand: "'Plus Jakarta Sans', 'Tajawal', sans-serif", display: "'DM Serif Display', serif" },
  },
  {
    id: 'arabesque',
    nameAr: 'عراقي تراثي',
    nameEn: 'Arabesque Heritage',
    descAr: 'لمطاعم الشرق الأوسط والمشاوي',
    descEn: 'Middle Eastern & grill restaurants',
    mode: 'light',
    preview: ['#b45309', '#fefce8', '#d97706'],
    colors: {
      primary: '#b45309',
      secondary: '#ffffff',
      surface: '#fefce8',
      surfaceElevated: '#ffffff',
      accentGold: '#d97706',
      accentWarm: '#fef3c7',
      text: '#451a03',
    },
    darkColors: {
      surface: '#1a1208',
      surfaceElevated: '#292017',
      accentWarm: '#451a03',
      text: '#fefce8',
    },
    fonts: { brand: "'Tajawal', sans-serif", display: "'Playfair Display', serif" },
  },
  {
    id: 'coffee-roast',
    nameAr: 'قهوة داكنة',
    nameEn: 'Coffee Roast',
    descAr: 'مثالي للكوفي شوب والمخابز',
    descEn: 'Perfect for coffee shops & bakeries',
    mode: 'light',
    preview: ['#78350f', '#fdf8f3', '#a16207'],
    colors: {
      primary: '#78350f',
      secondary: '#ffffff',
      surface: '#fdf8f3',
      surfaceElevated: '#ffffff',
      accentGold: '#a16207',
      accentWarm: '#fef3c7',
      text: '#431407',
    },
    darkColors: {
      surface: '#1c1008',
      surfaceElevated: '#292017',
      accentWarm: '#431407',
      text: '#fdf8f3',
    },
    fonts: { brand: "'Plus Jakarta Sans', 'Tajawal', sans-serif", display: "'DM Serif Display', serif" },
  },
];

export const DEFAULT_THEME_ID: MenuThemeId = 'modern-indigo';

export const getThemeById = (id: string): MenuTheme => {
  return MENU_THEMES.find((t) => t.id === id) ?? MENU_THEMES[0];
};

export const applyThemeToDocument = (theme: MenuTheme, mode: 'light' | 'dark') => {
  const root = document.documentElement;
  const isDark = mode === 'dark';
  const palette = isDark && theme.darkColors
    ? { ...theme.colors, ...theme.darkColors }
    : theme.colors;

  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-surface', palette.surface);
  root.style.setProperty('--color-surface-elevated', palette.surfaceElevated);
  root.style.setProperty('--color-accent-gold', theme.colors.accentGold);
  root.style.setProperty('--color-accent-warm', palette.accentWarm);
  root.style.setProperty('--color-text', palette.text);
  root.style.setProperty('--font-brand', theme.fonts.brand);
  root.style.setProperty('--font-display', theme.fonts.display);
  root.style.setProperty('--color-primary-glow', `${theme.colors.primary}55`);
  root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accentGold} 100%)`);
  root.style.setProperty('--gradient-surface', isDark
    ? `linear-gradient(180deg, ${palette.surface} 0%, color-mix(in srgb, ${theme.colors.primary} 6%, ${palette.surface}) 100%)`
    : `linear-gradient(180deg, ${palette.surface} 0%, color-mix(in srgb, ${theme.colors.primary} 3%, ${palette.surface}) 100%)`);
  root.dataset.menuTheme = theme.id;

  const layout = getLayoutForTheme(theme.id);
  root.dataset.menuLayout = layout.itemCard;
  root.dataset.menuHero = layout.hero;

  root.classList.toggle('dark', isDark);
};

export const getStoredThemeId = (slug: string): MenuThemeId | null => {
  const stored = localStorage.getItem(`emenu-theme-${slug}`);
  if (stored && MENU_THEMES.some((t) => t.id === stored)) return stored as MenuThemeId;
  return null;
};

export const storeThemeId = (slug: string, themeId: MenuThemeId) => {
  localStorage.setItem(`emenu-theme-${slug}`, themeId);
};

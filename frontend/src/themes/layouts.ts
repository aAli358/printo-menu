import type { MenuThemeId } from './index';

export type HeroVariant = 'glass' | 'cinematic' | 'minimal' | 'compact';
export type CategoryNavVariant = 'sticky-pills' | 'underline-tabs' | 'floating-chips';
export type ItemCardVariant = 'horizontal' | 'grid-2' | 'grid-3' | 'full-banner' | 'luxury-row' | 'zigzag' | 'compact-tile';
export type FeaturedVariant = 'carousel' | 'bento-grid' | 'none';
export type CategoryHeaderVariant = 'standard' | 'centered' | 'banner' | 'ornament';

export interface MenuLayoutConfig {
  hero: HeroVariant;
  categoryNav: CategoryNavVariant;
  itemCard: ItemCardVariant;
  featured: FeaturedVariant;
  categoryHeader: CategoryHeaderVariant;
  maxWidth: '2xl' | '4xl' | '5xl';
  showToolbar: boolean;
  showViewToggle: boolean;
  showAmbient: boolean;
  layoutDescAr: string;
  layoutDescEn: string;
}

/** Each theme = unique menu DESIGN (layout), not just colors */
export const THEME_LAYOUTS: Record<MenuThemeId, MenuLayoutConfig> = {
  'modern-indigo': {
    hero: 'glass',
    categoryNav: 'sticky-pills',
    itemCard: 'horizontal',
    featured: 'carousel',
    categoryHeader: 'standard',
    maxWidth: '4xl',
    showToolbar: true,
    showViewToggle: true,
    showAmbient: true,
    layoutDescAr: 'بطاقات أفقية + كاروسيل مميز + شريط أقسام',
    layoutDescEn: 'Horizontal cards + featured carousel + category pills',
  },
  'classic-gold': {
    hero: 'minimal',
    categoryNav: 'underline-tabs',
    itemCard: 'luxury-row',
    featured: 'none',
    categoryHeader: 'centered',
    maxWidth: '2xl',
    showToolbar: true,
    showViewToggle: false,
    showAmbient: false,
    layoutDescAr: 'قائمة فاخرة بدون صور كبيرة — اسم ووصف وسعر',
    layoutDescEn: 'Luxury text menu — name, description & price rows',
  },
  'emerald-fresh': {
    hero: 'cinematic',
    categoryNav: 'floating-chips',
    itemCard: 'grid-2',
    featured: 'bento-grid',
    categoryHeader: 'banner',
    maxWidth: '5xl',
    showToolbar: true,
    showViewToggle: false,
    showAmbient: true,
    layoutDescAr: 'شبكة صور كبيرة 2×2 + أقسام ببانر ملون',
    layoutDescEn: 'Large 2×2 image grid + colored category banners',
  },
  'rose-boutique': {
    hero: 'glass',
    categoryNav: 'floating-chips',
    itemCard: 'full-banner',
    featured: 'carousel',
    categoryHeader: 'centered',
    maxWidth: '2xl',
    showToolbar: false,
    showViewToggle: false,
    showAmbient: true,
    layoutDescAr: 'بطاقات عمودية بصورة كاملة العرض',
    layoutDescEn: 'Full-width vertical image banner cards',
  },
  'ocean-blue': {
    hero: 'cinematic',
    categoryNav: 'underline-tabs',
    itemCard: 'full-banner',
    featured: 'carousel',
    categoryHeader: 'banner',
    maxWidth: '4xl',
    showToolbar: true,
    showViewToggle: false,
    showAmbient: true,
    layoutDescAr: 'أصناف بعرض الشاشة + تبويبات أقسام',
    layoutDescEn: 'Full-width dish banners + tab categories',
  },
  'sunset-warm': {
    hero: 'compact',
    categoryNav: 'sticky-pills',
    itemCard: 'grid-2',
    featured: 'bento-grid',
    categoryHeader: 'standard',
    maxWidth: '4xl',
    showToolbar: true,
    showViewToggle: false,
    showAmbient: true,
    layoutDescAr: 'شبكة عائلية 2 أعمدة + بطاقات دافئة',
    layoutDescEn: 'Family 2-column grid with warm cards',
  },
  'midnight-lounge': {
    hero: 'minimal',
    categoryNav: 'underline-tabs',
    itemCard: 'compact-tile',
    featured: 'none',
    categoryHeader: 'standard',
    maxWidth: '4xl',
    showToolbar: true,
    showViewToggle: false,
    showAmbient: false,
    layoutDescAr: 'بلاطات مضغوطة 3 أعمدة — أسلوب lounge',
    layoutDescEn: 'Compact 3-column tiles — lounge style',
  },
  'minimal-mono': {
    hero: 'minimal',
    categoryNav: 'underline-tabs',
    itemCard: 'luxury-row',
    featured: 'none',
    categoryHeader: 'centered',
    maxWidth: '2xl',
    showToolbar: true,
    showViewToggle: false,
    showAmbient: false,
    layoutDescAr: 'نص فقط بخطوط فاصلة — بدون صور',
    layoutDescEn: 'Text-only with dividers — no images',
  },
  'arabesque': {
    hero: 'cinematic',
    categoryNav: 'sticky-pills',
    itemCard: 'zigzag',
    featured: 'carousel',
    categoryHeader: 'ornament',
    maxWidth: '4xl',
    showToolbar: true,
    showViewToggle: false,
    showAmbient: true,
    layoutDescAr: 'تناوب صورة/نص (zigzag) + زخارف تراثية',
    layoutDescEn: 'Alternating zigzag image/text + heritage ornaments',
  },
  'coffee-roast': {
    hero: 'compact',
    categoryNav: 'floating-chips',
    itemCard: 'compact-tile',
    featured: 'bento-grid',
    categoryHeader: 'standard',
    maxWidth: '4xl',
    showToolbar: true,
    showViewToggle: false,
    showAmbient: true,
    layoutDescAr: 'بلاطات كafe صغيرة + شبكة مميز',
    layoutDescEn: 'Small café tiles + featured mini grid',
  },
};

export const getLayoutForTheme = (themeId: MenuThemeId): MenuLayoutConfig =>
  THEME_LAYOUTS[themeId] ?? THEME_LAYOUTS['modern-indigo'];

export const maxWidthClass = (w: MenuLayoutConfig['maxWidth']) =>
  ({ '2xl': 'max-w-2xl', '4xl': 'max-w-4xl', '5xl': 'max-w-5xl' })[w];

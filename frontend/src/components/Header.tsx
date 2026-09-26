import React, { useState, useEffect } from 'react';
import { Sun, Moon, Star, Globe, CalendarDays } from 'lucide-react';
import { useMenuStore } from '../store/useMenuStore';
import { RatingModal } from './RatingModal';
import { t } from '../utils/locale';

interface HeaderProps {
  onBookClick?: () => void;
}

const glassPill = (dark: boolean, scrolled: boolean) => {
  if (dark) {
    return scrolled
      ? 'bg-slate-900/90 text-white border-white/15 shadow-lg shadow-black/20'
      : 'bg-slate-900/80 text-white border-white/20 shadow-md backdrop-blur-lg';
  }
  return scrolled
    ? 'bg-white/95 text-slate-900 border-slate-200/90 shadow-md'
    : 'bg-white/85 text-slate-800 border-white/30 shadow-sm backdrop-blur-lg';
};

export const Header: React.FC<HeaderProps> = ({ onBookClick }) => {
  const { restaurant, colorMode, toggleColorMode, language, setLanguage } = useMenuStore();
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dark = colorMode === 'dark';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 72);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const pill = glassPill(dark, scrolled);
  const iconCls = dark ? 'text-slate-200' : 'text-slate-700';

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 mobile-header px-3 transition-all duration-300 ${
          scrolled
            ? dark
              ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/10'
              : 'bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[430px] mx-auto flex items-center justify-between gap-2 py-2">
          <div className={`flex items-center gap-0 p-0.5 rounded-full border ${pill}`}>
            <button
              type="button"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              aria-label="Language"
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[0.65rem] font-extrabold min-h-9 active:scale-95 transition-transform"
            >
              <Globe size={14} className={iconCls} />
              <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
            <span className={`w-px h-4 ${dark ? 'bg-white/20' : 'bg-slate-200'}`} aria-hidden />
            <button
              type="button"
              onClick={toggleColorMode}
              aria-label="Theme"
              className="flex items-center justify-center px-3 py-2 rounded-full min-h-9 min-w-9 active:scale-95 transition-transform"
            >
              {colorMode === 'light' ? <Sun size={14} className={iconCls} /> : <Moon size={14} className={iconCls} />}
            </button>
          </div>

          {scrolled && restaurant && (
            <span className="flex-1 text-center font-display text-sm font-bold text-[var(--color-text)] truncate px-2">
              {t(language, restaurant.name, restaurant.name_en || restaurant.name)}
            </span>
          )}

          {!scrolled && <div className="flex-1" />}

          <div className="flex items-center gap-2">
            {onBookClick && (
              <button
                type="button"
                onClick={onBookClick}
                aria-label={t(language, 'حجز', 'Book')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[0.65rem] font-extrabold min-h-9 border active:scale-95 transition-transform ${pill}`}
              >
                <CalendarDays size={14} className={iconCls} />
                <span>{t(language, 'حجز', 'Book')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsRatingOpen(true)}
              aria-label="Rate"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[0.65rem] font-extrabold min-h-9 border active:scale-95 transition-transform ${pill}`}
            >
              <Star size={14} fill="currentColor" className="text-amber-500" />
              <span>{t(language, 'تقييم', 'Rate')}</span>
            </button>
          </div>
        </div>
      </header>

      <RatingModal isOpen={isRatingOpen} onClose={() => setIsRatingOpen(false)} />
    </>
  );
};

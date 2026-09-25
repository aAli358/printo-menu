import React, { useState, useEffect } from 'react';
import { Sun, Moon, Star, Globe, CalendarDays } from 'lucide-react';
import { useMenuStore } from '../store/useMenuStore';
import { RatingModal } from './RatingModal';
import { t } from '../utils/locale';

interface HeaderProps {
  onBookClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onBookClick }) => {
  const { restaurant, colorMode, toggleColorMode, language, setLanguage } = useMenuStore();
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-50 mobile-header px-3 transition-all duration-300 ${scrolled ? 'header-scrolled' : ''}`}>
        <div className="max-w-[430px] mx-auto flex items-center justify-between gap-2 py-2">
          {/* Lang + Theme segmented control */}
          <div className="header-segment">
            <button
              type="button"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              aria-label="Language"
              className="header-segment-btn"
            >
              <Globe size={14} />
              <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
            <span className="header-segment-divider" />
            <button
              type="button"
              onClick={toggleColorMode}
              aria-label="Theme"
              className="header-segment-btn"
            >
              {colorMode === 'light' ? <Sun size={14} /> : <Moon size={14} />}
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
                className="header-rate-btn"
              >
                <CalendarDays size={14} />
                <span>{t(language, 'حجز', 'Book')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsRatingOpen(true)}
              aria-label="Rate"
              className="header-rate-btn"
            >
              <Star size={14} fill="currentColor" />
              <span>{t(language, 'تقييم', 'Rate')}</span>
            </button>
          </div>
        </div>
      </header>

      <RatingModal isOpen={isRatingOpen} onClose={() => setIsRatingOpen(false)} />
    </>
  );
};

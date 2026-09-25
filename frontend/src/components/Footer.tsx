import React from 'react';
import { Globe, Heart } from 'lucide-react';
import { useMenuStore } from '../store/useMenuStore';
import { t } from '../utils/locale';

export const Footer: React.FC = () => {
  const { restaurant, language } = useMenuStore();

  return (
    <footer className="max-w-4xl mx-auto px-5 py-12 mt-8 border-t border-neutral-200/60 dark:border-neutral-800/60 relative z-10">
      <div className="flex flex-col items-center text-center gap-4">
        {restaurant?.phone && (
          <a
            href={`tel:${restaurant.phone}`}
            className="text-sm font-semibold text-neutral-500 hover:text-primary transition-colors"
          >
            {restaurant.phone}
          </a>
        )}

        <div className="flex items-center gap-2 text-neutral-400 text-xs font-medium">
          <Globe size={14} />
          <span>{t(language, 'منيو رقمي عالمي', 'Global Digital Menu')}</span>
        </div>

        <p className="flex items-center gap-1.5 text-[11px] text-neutral-400">
          {t(language, 'صُنع بـ', 'Crafted with')} <Heart size={11} className="text-red-400 fill-red-400" /> E-Menu
        </p>
      </div>
    </footer>
  );
};

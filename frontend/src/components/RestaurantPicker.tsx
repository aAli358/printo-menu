import React from 'react';
import { motion } from 'framer-motion';
import { Store, ChevronLeft } from 'lucide-react';
import type { RestaurantSummary } from '../api/client';
import { t } from '../utils/locale';
import type { Lang } from '../utils/locale';

interface RestaurantPickerProps {
  restaurants: RestaurantSummary[];
  language: Lang;
}

export const RestaurantPicker: React.FC<RestaurantPickerProps> = ({ restaurants, language }) => {
  const select = (slug: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('r', slug);
    window.location.href = url.toString();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-surface)] mesh-bg">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card rounded-[2rem] p-8 max-w-md w-full"
      >
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Store size={28} />
        </div>
        <h2 className="font-display text-2xl font-bold text-center text-neutral-900 dark:text-white mb-2">
          {t(language, 'اختر مطعمك', 'Choose Your Restaurant')}
        </h2>
        <p className="text-sm text-neutral-500 text-center mb-6">
          {t(language, 'حدد المطعم لعرض المنيو', 'Select a restaurant to view the menu')}
        </p>

        <div className="space-y-3">
          {restaurants.map((r) => (
            <button
              key={r.id}
              onClick={() => select(r.slug)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 hover:border-primary hover:bg-primary/5 transition-all text-start group"
            >
              {r.logo ? (
                <img src={r.logo} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-black shrink-0">
                  {r.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-neutral-900 dark:text-white truncate">
                  {t(language, r.name, r.name_en || r.name)}
                </p>
                <p className="text-xs text-neutral-400">{r.slug}</p>
              </div>
              <ChevronLeft size={18} className="text-neutral-300 group-hover:text-primary transition-colors shrink-0 rtl:rotate-180" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

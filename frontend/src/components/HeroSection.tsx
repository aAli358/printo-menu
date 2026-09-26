import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useMenuStore } from '../store/useMenuStore';
import { t } from '../utils/locale';

export const HeroSection: React.FC = () => {
  const { restaurant, language, tableNumber } = useMenuStore();

  const avgRating = useMemo(() => {
    if (!restaurant?.categories) return 0;
    const rated = restaurant.categories.flatMap((c) => c.items).filter((i) => i.average_rating > 0);
    if (!rated.length) return 0;
    return rated.reduce((s, i) => s + i.average_rating, 0) / rated.length;
  }, [restaurant]);

  if (!restaurant) return null;

  const name = t(language, restaurant.name, restaurant.name_en || restaurant.name);
  const isOpen = restaurant.opening_hours?.some((h) => !h.is_closed);

  const subtitleParts: string[] = [];
  if (avgRating > 0) subtitleParts.push(`★ ${avgRating.toFixed(1)}`);
  if (tableNumber) {
    subtitleParts.push(t(language, `طاولة ${tableNumber}`, `Table ${tableNumber}`));
  } else if (restaurant.address) {
    subtitleParts.push(restaurant.address);
  }
  const subtitle = subtitleParts.join(' · ');

  const statusBadge = (
    <div
      className={`inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
        isOpen
          ? 'text-emerald-950 bg-emerald-100 border-emerald-300'
          : 'text-red-950 bg-red-100 border-red-300'
      }`}
    >
      <span className={`w-1 h-1 rounded-full ${isOpen ? 'bg-emerald-700 animate-pulse' : 'bg-red-700'}`} />
      {isOpen ? t(language, 'مفتوح', 'Open') : t(language, 'مغلق', 'Closed')}
    </div>
  );

  return (
    <section className="hero-banner relative w-full pb-0">
      <div className="relative h-[min(36vw,200px)] min-h-[150px] max-h-[220px] overflow-hidden">
        {restaurant.cover_image ? (
          <img
            src={restaurant.cover_image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-[1.02]"
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-indigo-900 to-violet-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-[var(--color-surface)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent opacity-85" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 -mt-8 max-w-md mx-auto my-2 px-4 py-2 rounded-xl backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-white/20 shadow-md text-slate-900 dark:text-white"
      >
        <div className="flex flex-row items-center justify-between gap-3">
          {restaurant.logo ? (
            <img
              src={restaurant.logo}
              alt={name}
              className="w-12 h-12 rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl btn-glow flex items-center justify-center text-white font-black text-lg shrink-0">
              {name[0]}
            </div>
          )}

          <div className="flex-1 min-w-0 text-center px-1">
            <h1 className="font-display text-base font-bold leading-snug truncate tracking-tight">
              {name}
            </h1>
            {subtitle ? (
              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">{subtitle}</p>
            ) : null}
          </div>

          {statusBadge}
        </div>
      </motion.div>
    </section>
  );
};

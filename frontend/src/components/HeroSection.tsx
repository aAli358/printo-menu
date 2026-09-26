import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, UtensilsCrossed } from 'lucide-react';
import { useMenuStore } from '../store/useMenuStore';
import { t } from '../utils/locale';

export const HeroSection: React.FC = () => {
  const { restaurant, language, tableNumber, colorMode } = useMenuStore();

  const avgRating = useMemo(() => {
    if (!restaurant?.categories) return 0;
    const rated = restaurant.categories.flatMap((c) => c.items).filter((i) => i.average_rating > 0);
    if (!rated.length) return 0;
    return rated.reduce((s, i) => s + i.average_rating, 0) / rated.length;
  }, [restaurant]);

  if (!restaurant) return null;

  const name = t(language, restaurant.name, restaurant.name_en || restaurant.name);
  const desc = restaurant.description
    ? t(language, restaurant.description, restaurant.description_en || restaurant.description)
    : null;
  const isOpen = restaurant.opening_hours?.some((h) => !h.is_closed);

  return (
    <section className="hero-banner relative w-full pb-2">
      <div className="relative h-[min(42vw,280px)] min-h-[220px] max-h-[300px] overflow-hidden">
        {restaurant.cover_image ? (
          <img
            src={restaurant.cover_image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-[1.03]"
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-indigo-900 to-violet-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-[var(--color-surface)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent opacity-90" />

        <div className="absolute top-[calc(3.5rem+env(safe-area-inset-top))] inset-x-0 px-4 flex justify-between items-start pointer-events-none">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.65rem] font-medium border shadow-sm backdrop-blur-sm ${
              isOpen
                ? 'text-emerald-950 bg-emerald-100/95 border-emerald-300'
                : 'text-red-950 bg-red-100/95 border-red-300'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-700 animate-pulse' : 'bg-red-700'}`} />
            {isOpen ? t(language, 'مفتوح الآن', 'Open Now') : t(language, 'مغلق', 'Closed')}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`mx-4 -mt-[5rem] relative z-10 p-4 rounded-2xl backdrop-blur-lg border shadow-xl ${
          colorMode === 'dark'
            ? 'bg-slate-900/85 border-white/20 text-white'
            : 'bg-white/85 border-white/30 text-slate-900'
        }`}
      >
        <div className="flex items-start gap-4">
          {restaurant.logo ? (
            <img
              src={restaurant.logo}
              alt={name}
              className="w-[4.5rem] h-[4.5rem] rounded-2xl object-cover ring-2 ring-white/40 shadow-lg shrink-0"
            />
          ) : (
            <div className="w-[4.5rem] h-[4.5rem] rounded-2xl btn-glow flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0">
              {name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0 pt-0.5">
            <h1 className="font-display text-[1.4rem] font-bold leading-tight line-clamp-2 tracking-tight">
              {name}
            </h1>
            {desc && (
              <p className={`text-xs line-clamp-2 mt-1.5 leading-relaxed ${colorMode === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                {desc}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {avgRating > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                  <Star size={11} fill="currentColor" />
                  {avgRating.toFixed(1)}
                </span>
              )}
              {tableNumber && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                  <UtensilsCrossed size={11} />
                  {t(language, `طاولة ${tableNumber}`, `Table ${tableNumber}`)}
                </span>
              )}
              {restaurant.address && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border max-w-full ${
                    colorMode === 'dark'
                      ? 'text-slate-300 bg-white/5 border-white/10'
                      : 'text-slate-600 bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <MapPin size={11} className="shrink-0" />
                  <span className="truncate">{restaurant.address}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

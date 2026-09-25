import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, UtensilsCrossed } from 'lucide-react';
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
  const desc = restaurant.description
    ? t(language, restaurant.description, restaurant.description_en || restaurant.description)
    : null;
  const isOpen = restaurant.opening_hours?.some((h) => !h.is_closed);

  return (
    <section className="hero-banner relative w-full pb-1">
      {/* Cover */}
      <div className="relative h-[240px] overflow-hidden">
        {restaurant.cover_image ? (
          <img
            src={restaurant.cover_image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-105"
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: 'var(--gradient-primary)' }} />
        )}
        <div className="hero-overlay absolute inset-0" />
        <div className="absolute top-[calc(3.5rem+env(safe-area-inset-top))] inset-x-0 px-4 flex justify-between items-start pointer-events-none">
          <div className={`status-pill ${isOpen ? 'status-open' : 'status-closed'}`}>
            <span className={`status-dot ${isOpen ? 'pulse' : ''}`} />
            {isOpen ? t(language, 'مفتوح الآن', 'Open Now') : t(language, 'مغلق', 'Closed')}
          </div>
        </div>
      </div>

      {/* Floating identity card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="hero-float-card mx-4 -mt-[4.5rem] relative z-10"
      >
        <div className="flex items-start gap-3.5">
          {restaurant.logo ? (
            <img src={restaurant.logo} alt={name} className="hero-logo" />
          ) : (
            <div className="hero-logo btn-glow flex items-center justify-center text-white font-black text-2xl">
              {name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0 pt-0.5">
            <h1 className="font-display text-[1.35rem] font-bold text-[var(--color-text)] leading-tight line-clamp-2">
              {name}
            </h1>
            {desc && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                {desc}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {avgRating > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15">
                  <Star size={11} fill="currentColor" />
                  {avgRating.toFixed(1)}
                </span>
              )}
              {tableNumber && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/15">
                  <UtensilsCrossed size={11} />
                  {t(language, `طاولة ${tableNumber}`, `Table ${tableNumber}`)}
                </span>
              )}
              {restaurant.address && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium text-neutral-500 bg-neutral-100/80 dark:bg-white/5 border border-neutral-200/50 dark:border-white/8 max-w-full">
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

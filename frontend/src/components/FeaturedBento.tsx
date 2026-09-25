import React from 'react';
import { motion } from 'framer-motion';
import type { MenuItem } from '../types';
import { useMenuStore } from '../store/useMenuStore';
import { t, formatPrice } from '../utils/locale';

interface FeaturedBentoProps {
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
}

export const FeaturedBento: React.FC<FeaturedBentoProps> = ({ items, onSelect }) => {
  const { language, restaurant } = useMenuStore();
  if (items.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="font-display text-xl font-bold text-[var(--color-text)] mb-4">
        {t(language, '⭐ مختارات اليوم', "⭐ Today's Picks")}
      </h2>
      <div className="grid grid-cols-2 gap-3 auto-rows-[120px]">
        {items.map((item, idx) => {
          const name = language === 'ar' ? item.name : item.name_en || item.name;
          const span = idx === 0 ? 'col-span-2 row-span-2' : '';
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.08 }}
              onClick={() => onSelect(item)}
              className={`relative rounded-2xl overflow-hidden text-start ${span} min-h-[120px] group`}
            >
              {item.image ? (
                <img src={item.image} alt={name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="absolute inset-0" style={{ background: 'var(--gradient-primary)' }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-3">
                <p className="text-white font-black text-sm line-clamp-1">{name}</p>
                <p className="text-white/80 text-xs font-bold">{formatPrice(Number(item.base_price), restaurant?.currency_code, language)}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};

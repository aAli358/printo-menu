import React from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-scroll';
import { motion } from 'framer-motion';
import { useMenuStore } from '../store/useMenuStore';
import { t } from '../utils/locale';

interface StickyMenuNavProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalItems: number;
}

export const StickyMenuNav: React.FC<StickyMenuNavProps> = ({
  searchQuery, onSearchChange, totalItems,
}) => {
  const { restaurant, language, colorMode } = useMenuStore();

  if (!restaurant?.categories) return null;

  const label = (cat: { name: string; name_en?: string }) =>
    language === 'ar' ? cat.name : cat.name_en || cat.name;

  const stickyBg = colorMode === 'dark'
    ? 'bg-slate-950/85 border-white/10'
    : 'bg-[var(--color-surface)]/92 border-slate-200/60';

  return (
    <div className={`sticky-menu-nav ${stickyBg} shadow-sm`}>
      <div className="sticky-search-wrap px-3 pt-3 pb-2">
        <div className="flex items-center gap-3 h-[3.25rem] px-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] focus-within:ring-2 focus-within:ring-primary/25 transition-shadow">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Search size={18} strokeWidth={2.5} />
          </div>
          <input
            type="search"
            enterKeyHint="search"
            placeholder={t(language, 'ابحث عن طبقك المفضل...', 'Search your favorite dish...')}
            className="flex-1 min-w-0 h-full bg-transparent border-none outline-none text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-500"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mt-2 px-1">
          {totalItems} {t(language, 'صنف متاح', 'items available')}
        </p>
      </div>

      <nav className="category-chips-nav px-3 pb-3">
        <div className="relative">
          <div className="fade-edge-start" />
          <div className="fade-edge-end" />
          <ul className="flex overflow-x-auto no-scrollbar cat-scroll gap-2 py-1">
            {restaurant.categories.map((category, i) => (
              <li key={category.id} className="shrink-0">
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Link
                    to={`category-${category.id}`}
                    spy
                    smooth
                    offset={-180}
                    duration={500}
                    activeClass="cat-chip-active"
                    className="cat-chip"
                  >
                    {category.icon ? (
                      <img src={category.icon} alt="" className="cat-chip-icon" />
                    ) : (
                      <span className="cat-chip-dot" />
                    )}
                    <span>{label(category)}</span>
                  </Link>
                </motion.div>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
};

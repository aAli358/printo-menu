import React from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-scroll';
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
  const { restaurant, language } = useMenuStore();

  if (!restaurant?.categories) return null;

  const label = (cat: { name: string; name_en?: string }) =>
    language === 'ar' ? cat.name : cat.name_en || cat.name;

  return (
    <div className="sticky-menu-nav">
      {/* Sticky search */}
      <div className="sticky-search-wrap px-3 pt-3 pb-2">
        <div className="flex items-center gap-3 h-12 px-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <Search size={18} strokeWidth={2.5} className="text-slate-600 shrink-0" />
          <input
            type="search"
            enterKeyHint="search"
            placeholder={t(language, 'ابحث عن طبقك المفضل...', 'Search your favorite dish...')}
            className="flex-1 min-w-0 h-full bg-transparent border-none outline-none text-sm font-semibold text-slate-900 placeholder:text-gray-500"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-2 px-1">
          {totalItems} {t(language, 'صنف متاح', 'items available')}
        </p>
      </div>

      {/* Category chips */}
      <nav className="category-chips-nav px-3 pb-2.5">
        <div className="relative">
          <div className="fade-edge-start" />
          <div className="fade-edge-end" />
          <ul className="flex overflow-x-auto no-scrollbar cat-scroll gap-2.5 py-1">
            {restaurant.categories.map((category) => (
              <li key={category.id} className="shrink-0">
                <Link
                  to={`category-${category.id}`}
                  spy
                  smooth
                  offset={-168}
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
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
};

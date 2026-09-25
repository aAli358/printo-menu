import React from 'react';
import { Link } from 'react-scroll';
import { useMenuStore } from '../store/useMenuStore';

export const CategoryBar: React.FC = () => {
  const { restaurant, language } = useMenuStore();

  if (!restaurant?.categories) return null;

  const label = (cat: { name: string; name_en?: string }) =>
    language === 'ar' ? cat.name : cat.name_en || cat.name;

  return (
    <nav className="sticky mobile-sticky-nav z-40 bg-[var(--color-surface)]/95 backdrop-blur-xl border-b border-neutral-200/50 dark:border-white/5">
      <div className="relative px-3 py-2.5">
        <div className="absolute start-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[var(--color-surface)] to-transparent z-10 pointer-events-none" />
        <div className="absolute end-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[var(--color-surface)] to-transparent z-10 pointer-events-none" />

        <ul className="flex overflow-x-auto no-scrollbar cat-scroll gap-2 items-center">
          {restaurant.categories.map((category) => (
            <li key={category.id} className="shrink-0">
              <Link
                to={`category-${category.id}`}
                spy smooth offset={-130} duration={500}
                activeClass="cat-active"
                className="cat-pill flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-100/80 dark:bg-white/8 border border-neutral-200/50 dark:border-white/10 cursor-pointer whitespace-nowrap touch-target"
              >
                {category.icon && (
                  <img src={category.icon} alt="" className="w-5 h-5 rounded-full object-cover" />
                )}
                {label(category)}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .cat-active {
          background: var(--gradient-primary) !important;
          border-color: transparent !important;
          color: white !important;
          box-shadow: 0 4px 16px -4px var(--color-primary-glow);
        }
      `}</style>
    </nav>
  );
};

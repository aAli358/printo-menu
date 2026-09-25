import React from 'react';
import type { Category } from '../types';
import { useMenuStore } from '../store/useMenuStore';
import { t } from '../utils/locale';
import type { CategoryHeaderVariant } from '../themes/layouts';

interface CategorySectionHeaderProps {
  category: Category;
  count: number;
  variant: CategoryHeaderVariant;
}

export const CategorySectionHeader: React.FC<CategorySectionHeaderProps> = ({ category, count, variant }) => {
  const { language } = useMenuStore();
  const name = t(language, category.name, category.name_en || category.name);

  if (variant === 'banner') {
    return (
      <div className="mb-4 rounded-xl overflow-hidden relative min-h-[56px] flex items-center px-4 py-3" style={{ background: 'var(--gradient-primary)' }}>
        <div>
          <h2 className="font-display text-lg font-bold text-white">{name}</h2>
          <p className="text-white/70 text-[10px] font-bold">{count} {t(language, 'صنف', 'items')}</p>
        </div>
      </div>
    );
  }

  if (variant === 'centered' || variant === 'ornament') {
    return (
      <div className="mb-4 text-center py-2">
        <h2 className="font-display text-xl font-bold text-[var(--color-text)]">{name}</h2>
        <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-0.5">{count} {t(language, 'صنف', 'items')}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-200/60 dark:border-white/8">
      <h2 className="font-display text-lg font-bold text-[var(--color-text)]">{name}</h2>
      <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">{count}</span>
    </div>
  );
};

import React from 'react';
import { Search } from 'lucide-react';
import { useMenuStore } from '../store/useMenuStore';
import { t } from '../utils/locale';

interface MenuToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalItems: number;
  compact?: boolean;
}

export const MenuToolbar: React.FC<MenuToolbarProps> = ({
  searchQuery, onSearchChange, totalItems, compact = false,
}) => {
  const { language } = useMenuStore();

  return (
    <div className={`px-3 ${compact ? 'pt-2 pb-1' : 'pt-3 pb-2'} relative z-20`}>
      <div className="flex items-center gap-2 rounded-2xl bg-[var(--color-surface-elevated)] border border-neutral-200/60 dark:border-white/8 shadow-sm px-3 py-1">
        <Search size={18} className="text-neutral-400 shrink-0" strokeWidth={2.5} />
        <input
          type="search"
          enterKeyHint="search"
          placeholder={t(language, 'ابحث في المنيو...', 'Search menu...')}
          className="flex-1 h-11 bg-transparent text-sm font-semibold outline-none text-[var(--color-text)] placeholder:text-neutral-400 min-w-0"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-2 px-1">
        {totalItems} {t(language, 'صنف متاح', 'items')}
      </p>
    </div>
  );
};

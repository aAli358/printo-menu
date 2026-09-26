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
      <div className="flex items-center gap-3 h-[3.25rem] px-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Search size={18} strokeWidth={2.5} />
        </div>
        <input
          type="search"
          enterKeyHint="search"
          placeholder={t(language, 'ابحث في المنيو...', 'Search menu...')}
          className="flex-1 h-full min-w-0 bg-transparent border-none outline-none text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-500"
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

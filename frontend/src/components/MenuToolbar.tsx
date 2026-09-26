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
      <div className="flex items-center gap-3 h-12 px-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <Search size={18} className="text-slate-600 shrink-0" strokeWidth={2.5} />
        <input
          type="search"
          enterKeyHint="search"
          placeholder={t(language, 'ابحث في المنيو...', 'Search menu...')}
          className="flex-1 h-full min-w-0 bg-transparent border-none outline-none text-sm font-semibold text-slate-900 placeholder:text-gray-500"
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

import React from 'react';
import { Element } from 'react-scroll';
import type { Category, MenuItem } from '../types';
import { MenuCard } from './MenuCard';
import { FeaturedCarousel } from './FeaturedCarousel';
import { CategorySectionHeader } from './CategorySectionHeader';
import { getLayoutForTheme, type MenuLayoutConfig } from '../themes/layouts';
import { useMenuStore } from '../store/useMenuStore';
import { t } from '../utils/locale';
import { PlatformFooter } from './PlatformFooter';

interface MenuContentProps {
  searchQuery: string;
  featuredItems: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
}

const gridClass = (card: MenuLayoutConfig['itemCard']) => {
  switch (card) {
    case 'grid-2': return 'grid grid-cols-2 gap-2.5';
    case 'grid-3':
    case 'compact-tile': return 'grid grid-cols-2 gap-2.5';
    case 'full-banner':
    case 'zigzag':
    case 'luxury-row': return 'flex flex-col';
    default: return 'flex flex-col gap-4';
  }
};

export const MenuContent: React.FC<MenuContentProps> = ({
  searchQuery, featuredItems, onSelectItem,
}) => {
  const { restaurant, language, menuThemeId } = useMenuStore();
  const layout = getLayoutForTheme(menuThemeId);
  const itemVariant = layout.itemCard;

  return (
    <main className="px-3 py-5 relative z-10 pb-6 max-w-[430px] mx-auto w-full">
      {!searchQuery && featuredItems.length > 0 && layout.featured === 'carousel' && (
        <FeaturedCarousel items={featuredItems.slice(0, 6)} onSelect={onSelectItem} />
      )}

      {restaurant?.categories.map((category: Category) => {
        const filteredItems = category.items.filter(
          (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.name_en?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filteredItems.length === 0) return null;

        return (
          <Element key={category.id} name={`category-${category.id}`} className="mb-8 last:mb-0 scroll-mt-36">
            <CategorySectionHeader
              category={category}
              count={filteredItems.length}
              variant={layout.categoryHeader}
            />
            <div className={gridClass(itemVariant)}>
              {filteredItems.map((item, idx) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  index={idx}
                  variant={itemVariant}
                  onSelect={onSelectItem}
                />
              ))}
            </div>
          </Element>
        );
      })}

      {searchQuery && restaurant?.categories.every(
        (c) => !c.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
      ) && (
        <div className="py-16 text-center">
          <div className="text-4xl mb-4 opacity-20">🔍</div>
          <h3 className="font-display text-lg font-bold text-neutral-400">
            {t(language, 'لا توجد نتائج', 'No results found')}
          </h3>
        </div>
      )}

      {restaurant?.platform_branding && (
        <PlatformFooter branding={restaurant.platform_branding} language={language} variant="menu" />
      )}
    </main>
  );
};

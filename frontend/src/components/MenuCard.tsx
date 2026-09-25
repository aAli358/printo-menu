import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Star } from 'lucide-react';
import type { MenuItem } from '../types';
import { useMenuStore } from '../store/useMenuStore';
import { t, formatPrice } from '../utils/locale';
import type { ItemCardVariant } from '../themes/layouts';

interface MenuCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
  index?: number;
  variant?: ItemCardVariant | 'list' | 'grid';
}

const tagConfig: Record<string, { labelAr: string; labelEn: string; cls: string }> = {
  Spicy: { labelAr: 'حار', labelEn: 'Spicy', cls: 'tag-spicy' },
  Vegan: { labelAr: 'نباتي', labelEn: 'Vegan', cls: 'tag-vegan' },
  New: { labelAr: 'جديد', labelEn: 'New', cls: 'tag-new' },
};

export const MenuCard: React.FC<MenuCardProps> = ({ item, onSelect, index = 0, variant = 'horizontal' }) => {
  const { language, restaurant } = useMenuStore();
  const name = language === 'ar' ? item.name : item.name_en || item.name;
  const desc = language === 'ar' ? item.description : item.description_en || item.description;
  const price = formatPrice(Number(item.base_price), restaurant?.currency_code, language);
  const v = variant === 'list' ? 'horizontal' : variant === 'grid' ? 'grid-2' : variant;

  const tap = {
    whileTap: { scale: 0.97 },
    transition: { type: 'spring' as const, stiffness: 400, damping: 28 },
  };

  const openItem = () => onSelect(item);

  const AddButton = ({ size = 'md', className = '' }: { size?: 'sm' | 'md'; className?: string }) => (
    <motion.div
      role="button"
      tabIndex={0}
      whileTap={{ scale: 0.88 }}
      className={`product-add-btn ${size === 'sm' ? 'product-add-btn-sm' : ''} ${className}`}
      onClick={(e) => { e.stopPropagation(); openItem(); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          openItem();
        }
      }}
      aria-label={t(language, 'أضف', 'Add')}
    >
      <Plus size={size === 'sm' ? 18 : 20} strokeWidth={2.5} />
    </motion.div>
  );

  const CardShell = ({ className, children }: { className: string; children: React.ReactNode }) => (
    <motion.div
      {...tap}
      role="button"
      tabIndex={0}
      onClick={openItem}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openItem(); }}
      className={className}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {children}
    </motion.div>
  );

  /* Grid cards */
  if (v === 'grid-2' || v === 'grid-3' || v === 'compact-tile') {
    return (
      <CardShell className="product-grid-card">
        <div className="product-grid-img-wrap">
          {item.image ? (
            <img src={item.image} alt={name} className="product-grid-img" loading="lazy" />
          ) : (
            <div className="product-grid-img product-grid-placeholder">🍽️</div>
          )}
          <AddButton size="sm" />
        </div>
        <div className="product-grid-body">
          <h3 className="product-grid-name">{name}</h3>
          <p className="product-grid-price">{price}</p>
        </div>
      </CardShell>
    );
  }

  /* Banner card */
  if (v === 'full-banner' || v === 'zigzag') {
    return (
      <CardShell className="product-banner-card">
        {item.image && (
          <img src={item.image} alt={name} className="product-banner-img" loading="lazy" />
        )}
        <div className="product-banner-overlay" />
        <div className="product-banner-content">
          <div className="min-w-0 flex-1">
            <h3 className="product-banner-name">{name}</h3>
            {desc && <p className="product-banner-desc">{desc}</p>}
            <p className="product-banner-price">{price}</p>
          </div>
          <AddButton />
        </div>
      </CardShell>
    );
  }

  /* Luxury text row */
  if (v === 'luxury-row') {
    return (
      <CardShell className="product-luxury-row">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-base text-[var(--color-text)]">{name}</h3>
          <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{desc}</p>
        </div>
        <div className="text-end shrink-0 flex flex-col items-end gap-2">
          <p className="product-price-lg">{price}</p>
          <AddButton size="sm" />
        </div>
      </CardShell>
    );
  }

  /* Default — luxury horizontal card */
  return (
    <motion.article
      {...tap}
      className="product-card"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={openItem}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openItem(); }}
        className="product-card-main"
      >
        {item.image ? (
          <img src={item.image} alt={name} className="product-card-img" loading="lazy" />
        ) : (
          <div className="product-card-img product-card-img-placeholder">🍽️</div>
        )}
        <div className="product-card-body">
          <div className="flex items-start justify-between gap-2">
            <h3 className="product-card-name">{name}</h3>
            {item.average_rating >= 4 && (
              <span className="product-rating">
                <Star size={10} fill="currentColor" />
                {item.average_rating.toFixed(1)}
              </span>
            )}
          </div>
          {desc && <p className="product-card-desc">{desc}</p>}
          {item.tags.length > 0 && (
            <div className="product-tags">
              {item.tags.slice(0, 2).map((tag) => {
                const c = tagConfig[tag];
                return c ? (
                  <span key={tag} className={`product-tag ${c.cls}`}>
                    {t(language, c.labelAr, c.labelEn)}
                  </span>
                ) : null;
              })}
            </div>
          )}
          <p className="product-price-lg mt-auto pt-2">{price}</p>
        </div>
      </div>
      <AddButton />
    </motion.article>
  );
};

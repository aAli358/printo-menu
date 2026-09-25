import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import { Star, Plus } from 'lucide-react';
import type { MenuItem } from '../types';
import { useMenuStore } from '../store/useMenuStore';
import { t, formatPrice } from '../utils/locale';
import 'swiper/css';

interface FeaturedCarouselProps {
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ items, onSelect }) => {
  const { language, restaurant } = useMenuStore();
  if (items.length === 0) return null;

  return (
    <section className="mb-5">
      <h2 className="font-display text-sm font-bold text-[var(--color-text)] mb-3 px-1 flex items-center gap-1.5">
        <span className="w-1 h-4 rounded-full bg-primary" />
        {t(language, 'الأكثر طلباً', 'Best Sellers')}
      </h2>

      <Swiper modules={[FreeMode]} spaceBetween={12} slidesPerView={1.18} freeMode className="!overflow-visible">
        {items.map((item) => {
          const name = language === 'ar' ? item.name : item.name_en || item.name;
          const price = formatPrice(Number(item.base_price), restaurant?.currency_code, language);
          return (
            <SwiperSlide key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="product-banner-card w-full active:scale-[0.98] transition-transform"
              >
                {item.image ? (
                  <img src={item.image} alt={name} className="product-banner-img" loading="lazy" />
                ) : (
                  <div className="product-banner-img product-grid-placeholder">🍽️</div>
                )}
                <div className="product-banner-overlay" />
                <div className="product-banner-content">
                  <div className="min-w-0 flex-1">
                    <h3 className="product-banner-name">{name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="product-banner-price">{price}</p>
                      {item.average_rating > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-300 text-[10px] font-bold">
                          <Star size={10} fill="currentColor" /> {item.average_rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="product-add-btn shrink-0" style={{ position: 'relative', bottom: 'auto', insetInlineEnd: 'auto' }}>
                    <Plus size={18} />
                  </span>
                </div>
              </button>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
};

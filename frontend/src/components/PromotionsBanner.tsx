import React, { useEffect, useState } from 'react';
import { Tag, Sparkles } from 'lucide-react';
import { fetchActivePromotions, type Promotion } from '../api/promotions';
import { useMenuStore } from '../store/useMenuStore';

const promoLabel = (promo: Promotion, lang: 'ar' | 'en') => {
  const pct = promo.discount_percent ? `${promo.discount_percent}%` : '';
  const amt = promo.discount_amount ? promo.discount_amount : '';
  const off = lang === 'ar' ? 'خصم' : 'off';
  if (pct) return `${promo.name} — ${pct} ${off}`;
  if (amt) return `${promo.name} — ${amt} ${off}`;
  if (promo.promo_type === 'buy_x_get_y' && promo.buy_quantity && promo.get_quantity) {
    return lang === 'ar'
      ? `${promo.name} — اشترِ ${promo.buy_quantity} واحصل على ${promo.get_quantity}`
      : `${promo.name} — Buy ${promo.buy_quantity} get ${promo.get_quantity}`;
  }
  return promo.name;
};

export const PromotionsBanner: React.FC = () => {
  const { language } = useMenuStore();
  const [promos, setPromos] = useState<Promotion[]>([]);

  useEffect(() => {
    fetchActivePromotions()
      .then((data) => setPromos(data.filter((p) => p.promo_type !== 'coupon')))
      .catch(() => setPromos([]));
  }, []);

  if (promos.length === 0) return null;

  return (
    <div className="px-3 -mt-2 mb-2">
      <div className="max-w-[430px] mx-auto space-y-2">
        {promos.slice(0, 3).map((promo) => (
          <div
            key={promo.id}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20"
          >
            {promo.promo_type === 'happy_hour' ? (
              <Sparkles size={16} className="text-[var(--color-primary)] shrink-0" />
            ) : (
              <Tag size={16} className="text-[var(--color-primary)] shrink-0" />
            )}
            <p className="text-xs font-bold text-[var(--color-text)] leading-snug">
              {promoLabel(promo, language)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

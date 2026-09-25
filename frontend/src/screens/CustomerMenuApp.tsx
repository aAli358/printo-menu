import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { CategoryBar } from '../components/CategoryBar';
import { MenuContent } from '../components/MenuContent';
import { StickyMenuNav } from '../components/StickyMenuNav';
import { ModifiersDrawer } from '../components/ModifiersDrawer';
import { CartDrawer } from '../components/CartDrawer';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { CallWaiterButton } from '../components/CallWaiterButton';
import { CustomerBookingDrawer } from '../components/CustomerBookingDrawer';
import { PromotionsBanner } from '../components/PromotionsBanner';
import { useMenuStore } from '../store/useMenuStore';
import { getRestaurantMenu, getRestaurantsList, resolveRestaurantSlug, type RestaurantSummary } from '../api/client';
import { RestaurantPicker } from '../components/RestaurantPicker';
import { getLayoutForTheme } from '../themes/layouts';
import { t, formatPrice } from '../utils/locale';
import type { MenuItem } from '../types';

export const CustomerMenuApp: React.FC = () => {
  const {
    restaurant, setRestaurant, loading, setLoading, error, setError,
    applyBranding, language, tableNumber, setTableNumber, setAccessSource,
    cart, cartTotal, menuThemeId,
  } = useMenuStore();

  const layout = getLayoutForTheme(menuThemeId);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableRestaurants, setAvailableRestaurants] = useState<RestaurantSummary[] | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const querySlug = urlParams.get('r');
      const queryTable = urlParams.get('table');
      const querySource = urlParams.get('source');
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const pathSlug = pathParts[0] === 'r' ? pathParts[1] : pathParts[pathParts.length - 1];

      if (queryTable) setTableNumber(queryTable);
      if (querySource === 'qr' || querySource === 'nfc') setAccessSource(querySource as 'qr' | 'nfc');

      setLoading(true);
      setError(null);
      setAvailableRestaurants(null);

      try {
        const slug = await resolveRestaurantSlug(querySlug || pathSlug);
        if (!slug) {
          const list = await getRestaurantsList();
          if (list.length === 0) {
            setError(t(language, 'لا توجد مطاعم متاحة حالياً.', 'No restaurants available.'));
          } else {
            setAvailableRestaurants(list);
          }
          setLoading(false);
          return;
        }
        const data = await getRestaurantMenu(slug);
        setRestaurant(data);
        applyBranding(data);
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number }; code?: string };
        const status = axiosErr.response?.status;
        if (!axiosErr.response) {
          setError(t(language, 'تعذر الاتصال.\n\nتحقق من الإنترنت وحاول مجدداً.', 'Connection failed.\n\nCheck your network and retry.'));
        } else if (status === 404) {
          setError(t(language, 'المطعم غير موجود.\n\nجرّب: ?r=shams&table=1', 'Restaurant not found.\n\nTry: ?r=shams&table=1'));
        } else if (status === 403) {
          setError(t(language, 'هذا المطعم موقوف مؤقتاً.\n\nتواصل مع إدارة المنصة.', 'This restaurant is suspended.\n\nContact platform support.'));
        } else {
          setError(t(language, `حدث خطأ (${status ?? '?'}).`, `Error (${status ?? '?'}).`));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [setRestaurant, setLoading, setError, applyBranding, setTableNumber, setAccessSource, language]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const allItems = useMemo(() => restaurant?.categories.flatMap((c) => c.items) ?? [], [restaurant]);
  const featuredItems = useMemo(
    () => allItems.filter((i) => i.is_available && (i.average_rating >= 4 || (i.tags ?? []).includes('New')))
      .sort((a, b) => b.average_rating - a.average_rating).slice(0, 8),
    [allItems],
  );
  const totalAvailable = useMemo(() => allItems.filter((i) => i.is_available).length, [allItems]);
  const isTableMissing = restaurant?.access_mode === 'table_specific' && !tableNumber;
  const shell = (content: React.ReactNode) => <MobileShell>{content}</MobileShell>;

  if (loading) {
    return shell(
      <>
        <Header />
        <div className="pt-24 px-3"><SkeletonLoader /></div>
      </>
    );
  }

  if (availableRestaurants?.length) {
    return shell(<RestaurantPicker restaurants={availableRestaurants} language={language} />);
  }

  if (error || isTableMissing) {
    return shell(
      <div className="min-h-[80dvh] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">{isTableMissing ? '📍' : '🍽️'}</div>
        <h2 className="font-display text-xl font-bold mb-4 whitespace-pre-line leading-relaxed">
          {isTableMissing ? t(language, 'امسح QR على طاولتك', 'Scan QR on your table') : error}
        </h2>
        {!isTableMissing && (
          <button onClick={() => window.location.reload()} className="w-full max-w-xs py-3.5 btn-glow text-white rounded-2xl font-bold active:scale-95">
            {t(language, 'إعادة المحاولة', 'Retry')}
          </button>
        )}
      </div>
    );
  }

  return shell(
    <div className="min-h-[100dvh] pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <Header onBookClick={() => setIsBookingOpen(true)} />
      <HeroSection />
      <PromotionsBanner />
      {layout.showToolbar && (
        <StickyMenuNav searchQuery={searchQuery} onSearchChange={setSearchQuery} totalItems={totalAvailable} />
      )}
      {!layout.showToolbar && <CategoryBar />}
      <MenuContent searchQuery={searchQuery} featuredItems={featuredItems} onSelectItem={setSelectedItem} />
      <ModifiersDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <CustomerBookingDrawer isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
      <CallWaiterButton hasCart={cart.length > 0} />
      {cart.length > 0 && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed inset-x-0 mobile-bottom-bar z-40 px-3 pointer-events-none"
        >
          <div className="max-w-[430px] mx-auto pointer-events-auto">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full h-14 btn-glow text-white rounded-2xl flex items-center justify-between px-5 font-bold shadow-xl active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={20} />
                <span>{t(language, 'السلة', 'Cart')}</span>
                <span className="w-5 h-5 rounded-md bg-white/20 text-xs font-black flex items-center justify-center">{cart.length}</span>
              </div>
              <span className="font-black text-base">{formatPrice(cartTotal, restaurant?.currency_code, language)}</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

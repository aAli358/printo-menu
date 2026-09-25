import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import type { MenuItem, Variant, Addon } from '../types';
import { useMenuStore } from '../store/useMenuStore';

interface ModifiersDrawerProps {
  item: MenuItem | null;
  onClose: () => void;
}

export const ModifiersDrawer: React.FC<ModifiersDrawerProps> = ({ item, onClose }) => {
  const { addToCart, language, restaurant } = useMenuStore();
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  useEffect(() => {
    if (item) {
      setSelectedVariant(item.variants.length > 0 ? item.variants[0] : null);
      setSelectedAddons([]);
      setQuantity(1);
    }
  }, [item]);

  useEffect(() => {
    if (!item) return;
    
    let price = parseFloat(selectedVariant?.price || item.base_price);
    selectedAddons.forEach(addon => {
      price += parseFloat(addon.price);
    });
    
    setTotalPrice(price * quantity);
  }, [item, selectedVariant, selectedAddons, quantity]);

  if (!item) return null;

  const handleToggleAddon = (addon: Addon) => {
    setSelectedAddons(prev => 
      prev.find(a => a.id === addon.id) 
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const handleAddToCart = () => {
    addToCart({
      id: Math.random().toString(36).substr(2, 9),
      menuItem: item,
      selectedVariant,
      selectedAddons,
      quantity,
      totalPrice
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-0 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 pointer-events-auto"
        />
        
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-[430px] bottom-sheet bg-[var(--color-surface-elevated)] p-5 shadow-2xl relative z-10 pointer-events-auto overflow-y-auto no-scrollbar"
          style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
        >
          <div className="w-12 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-6" />
          
          <div className="flex justify-between items-start mb-6 bg-gray-50 dark:bg-gray-800 -mx-6 -mt-6 p-8 rounded-b-[3rem] border-b dark:border-gray-700 shadow-sm">
            <div className="flex-1">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
                {t(item.name, item.name_en || item.name)}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {t(item.description, item.description_en || item.description)}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 bg-white dark:bg-gray-700 rounded-2xl text-gray-500 shadow-xl hover:scale-110 active:scale-95 transition-all"
            >
              <X size={24} />
            </button>
          </div>

          <div className="py-4">
            {/* Variants Section (Radio Buttons Style) */}
            {item.variants.length > 0 && (
              <div className="mb-10 px-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">
                    {t('اختر الحجم', 'Choose Size')}
                  </h3>
                  <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-black uppercase tracking-widest ml-auto">
                    {t('إلزامي', 'Required')}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {item.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`w-full p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between group relative overflow-hidden ${
                        selectedVariant?.id === v.id 
                          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' 
                          : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedVariant?.id === v.id ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedVariant?.id === v.id && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className={`font-black text-lg ${selectedVariant?.id === v.id ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                          {t(v.name, v.name_en || v.name)}
                        </span>
                      </div>
                      <span className="font-black text-lg relative z-10">
                        {v.price} <span className="text-[10px] text-gray-400">{restaurant?.currency_code || t('د.ع', 'IQD')}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Addons Section (Checkbox Style) */}
            {item.addon_groups.map((group) => (
              <div key={group.id} className="mb-10 px-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">
                    {t(group.name, group.name_en || group.name)}
                  </h3>
                  <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1 rounded-full font-black uppercase tracking-widest ml-auto">
                    {t('اختياري', 'Optional')}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {group.addons.map((addon) => {
                    const isSelected = selectedAddons.find(a => a.id === addon.id);
                    return (
                      <button
                        key={addon.id}
                        onClick={() => handleToggleAddon(addon)}
                        className={`w-full p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between group relative overflow-hidden ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' 
                            : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-4 relative z-10">
                          <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${
                            isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isSelected && <Plus size={14} strokeWidth={4} />}
                          </div>
                          <span className={`font-black text-lg ${isSelected ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                            {t(addon.name, addon.name_en || addon.name)}
                          </span>
                        </div>
                        <span className="font-black text-lg relative z-10 text-primary">
                          +{addon.price} <span className="text-[10px] text-gray-400 font-bold uppercase">{restaurant?.currency_code || t('د.ع', 'IQD')}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Quantity and Footer */}
          <div className="sticky bottom-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md pt-6 pb-2 border-t dark:border-gray-800 flex flex-col gap-6 -mx-6 px-6 mb-[-1.5rem]">
            <div className="flex items-center justify-center gap-8 bg-gray-100 dark:bg-gray-800 p-3 rounded-[2rem] self-center">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-12 h-12 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-lg text-gray-900 dark:text-white active:scale-90 transition-all"
              >
                <Minus size={20} strokeWidth={3} />
              </button>
              <span className="text-2xl font-black w-8 text-center text-gray-900 dark:text-white">{quantity}</span>
              <button 
                onClick={() => setQuantity(q => q + 1)}
                className="w-12 h-12 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-lg text-gray-900 dark:text-white active:scale-90 transition-all"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>

            <button 
              onClick={handleAddToCart}
              className="w-full h-18 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[2rem] font-black text-lg flex items-center justify-between px-10 shadow-2xl hover:bg-primary dark:hover:bg-primary dark:hover:text-white active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag size={24} />
                <span>{t('أضف للسلة', 'Add to Cart')}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span>{totalPrice.toLocaleString()}</span>
                <span className="text-[10px] uppercase opacity-60 font-bold">{restaurant?.currency_code || t('د.ع', 'IQD')}</span>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

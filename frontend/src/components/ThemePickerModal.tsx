import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Palette, Sparkles } from 'lucide-react';
import { useMenuStore } from '../store/useMenuStore';
import { MENU_THEMES } from '../themes';
import { t } from '../utils/locale';

interface ThemePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeMockup: React.FC<{ primary: string; surface: string; accent: string; elevated: string }> = ({
  primary, surface, accent, elevated,
}) => (
  <div className="theme-mock border border-black/5 shadow-inner" style={{ background: surface }}>
    <div className="theme-mock-bar" style={{ background: primary }} />
    <div className="theme-mock-body">
      <div className="theme-mock-card" style={{ background: elevated, border: `1px solid ${primary}22` }} />
      <div className="theme-mock-card" style={{ background: accent }} />
      <div className="theme-mock-card" style={{ background: primary, opacity: 0.7 }} />
    </div>
  </div>
);

export const ThemePickerModal: React.FC<ThemePickerModalProps> = ({ isOpen, onClose }) => {
  const { language, menuThemeId, setMenuTheme } = useMenuStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="relative w-full max-w-xl max-h-[88vh] glass-card-strong rounded-t-[2.5rem] sm:rounded-[2rem] overflow-hidden flex flex-col"
            style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
          >
            <div className="p-6 border-b border-white/10 shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 opacity-30" style={{ background: 'var(--gradient-primary)' }} />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 btn-glow rounded-2xl flex items-center justify-center text-white">
                    <Palette size={22} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
                      {t(language, 'ثيمات المنيو', 'Menu Themes')}
                      <Sparkles size={16} className="text-primary" />
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {t(language, '10 تصاميم خرافية — اختر ما يناسبك', '10 stunning designs — pick yours')}
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-white/10 transition-colors">
                  <X size={20} className="text-neutral-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 no-scrollbar">
              {MENU_THEMES.map((theme, idx) => {
                const isActive = menuThemeId === theme.id;
                return (
                  <motion.button
                    key={theme.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => setMenuTheme(theme.id)}
                    className={`relative text-start p-4 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                      isActive
                        ? 'border-primary shadow-lg active'
                        : 'border-neutral-100/80 dark:border-white/8 hover:border-primary/40'
                    } gradient-border`}
                    style={{ background: isActive ? 'color-mix(in srgb, var(--color-primary) 6%, var(--color-surface-elevated))' : 'var(--color-surface-elevated)' }}
                  >
                    {isActive && (
                      <div className="absolute top-3 end-3 w-7 h-7 btn-glow rounded-full flex items-center justify-center text-white z-10">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}

                    <ThemeMockup
                      primary={theme.colors.primary}
                      surface={theme.colors.surface}
                      accent={theme.colors.accentWarm}
                      elevated={theme.colors.surfaceElevated}
                    />

                    <p className="font-black text-sm text-[var(--color-text)] mt-3 mb-0.5">
                      {t(language, theme.nameAr, theme.nameEn)}
                    </p>
                    <p className="text-[10px] text-neutral-400 leading-relaxed line-clamp-2">
                      {t(language, theme.descAr, theme.descEn)}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            <div className="p-5 border-t border-white/10 shrink-0 text-center">
              <p className="text-[11px] text-neutral-400">
                ✨ {t(language, 'يُطبَّق فوراً ويُحفظ تلقائياً', 'Applies instantly & saves automatically')}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

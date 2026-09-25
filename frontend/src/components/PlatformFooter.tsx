import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { PlatformBranding } from '../types';
import { t, type Lang } from '../utils/locale';

interface PlatformFooterProps {
  branding: PlatformBranding;
  language?: Lang;
  variant?: 'menu' | 'landing';
  /** Extra links shown under landing footer (e.g. login, demo). */
  landingLinks?: React.ReactNode;
}

export const PlatformFooter: React.FC<PlatformFooterProps> = ({
  branding,
  language = 'ar',
  variant = 'menu',
  landingLinks,
}) => {
  if (!branding?.show || !branding.website_url) return null;

  const menuLabel = t(
    language,
    `صُمم بكل حب بواسطة ${branding.name}`,
    `Crafted with love by ${branding.name}`,
  );

  const copyrightLabel = t(
    language,
    `جميع الحقوق محفوظة © ${branding.name}`,
    `All rights reserved © ${branding.name}`,
  );

  const isLanding = variant === 'landing';
  const label = isLanding ? copyrightLabel : menuLabel;

  const Logo = () =>
    branding.logo_url ? (
      <img
        src={branding.logo_url}
        alt={branding.name}
        className={
          isLanding
            ? 'h-10 w-10 rounded-xl object-contain shrink-0'
            : 'h-7 w-7 rounded-lg object-contain shrink-0'
        }
        loading="lazy"
      />
    ) : (
      <span
        className={
          isLanding
            ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/30 text-sm font-black text-indigo-200'
            : 'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[10px] font-black text-[var(--color-primary)]'
        }
      >
        B
      </span>
    );

  if (isLanding) {
    return (
      <footer className="py-10 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 text-center">
          <a
            href={branding.website_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="group inline-flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 py-6 transition-all hover:border-indigo-400/40 hover:bg-white/10"
          >
            <Logo />
            <p className="text-sm font-semibold text-indigo-100/85 group-hover:text-white transition-colors">
              {label}
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300/70 group-hover:text-indigo-200 transition-colors">
              {t(language, 'زيارة صفحتنا', 'Visit our page')}
              <ExternalLink size={14} aria-hidden />
            </span>
          </a>
          {landingLinks && (
            <div className="flex flex-wrap justify-center gap-4 text-sm text-indigo-200/40">
              {landingLinks}
            </div>
          )}
        </div>
      </footer>
    );
  }

  return (
    <footer className="px-3 pt-6 pb-4 mt-2">
      <a
        href={branding.website_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="group block max-w-[430px] mx-auto rounded-2xl border border-neutral-200/70 dark:border-white/10 bg-neutral-50/90 dark:bg-white/5 backdrop-blur-sm px-4 py-3.5 transition-all active:scale-[0.99] hover:border-[var(--color-primary)]/30 hover:shadow-md hover:shadow-[var(--color-primary-glow)]/10"
      >
        <div className="flex items-center justify-center gap-2.5 text-center">
          <Logo />
          <p className="text-[11px] leading-snug font-semibold text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors">
            {label}
          </p>
          <ExternalLink
            size={12}
            className="shrink-0 text-neutral-400 opacity-60 group-hover:opacity-100 group-hover:text-[var(--color-primary)] transition-all"
            aria-hidden
          />
        </div>
      </a>
    </footer>
  );
};

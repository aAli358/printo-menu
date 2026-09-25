import React from 'react';
import { motion } from 'framer-motion';

interface SessionSplashProps {
  message?: string;
}

export const SessionSplash: React.FC<SessionSplashProps> = ({
  message = 'جاري تجهيز لوحة التحكم...',
}) => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070714] text-white" dir="rtl">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6"
    >
      <div className="relative w-20 h-20">
        <motion.div
          className="absolute inset-0 rounded-2xl bg-indigo-600/30"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl shadow-lg shadow-indigo-600/40">
          🍽️
        </div>
      </div>
      <div className="w-10 h-10 border-[3px] border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
      <p className="text-sm font-bold text-indigo-200/80">{message}</p>
    </motion.div>
  </div>
);

export function hasSessionHash(): boolean {
  return typeof window !== 'undefined' && window.location.hash.startsWith('#session=');
}

export function hasHandoffQuery(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('handoff');
}

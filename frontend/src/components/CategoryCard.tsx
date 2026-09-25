import React from 'react';
import { motion } from 'framer-motion';
import type { Category } from '../types';
import { useMenuStore } from '../store/useMenuStore';

interface CategoryCardProps {
  category: Category;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const { language } = useMenuStore();
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative w-full h-64 rounded-[2.5rem] overflow-hidden mb-6 shadow-xl group cursor-pointer active:scale-95 transition-transform"
    >
      {/* Background Image */}
      {category.icon ? (
        <img 
          src={category.icon as any} 
          alt={category.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700" />
      )}

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Category Info */}
      <div className="absolute inset-0 p-8 flex flex-col justify-end">
        <div className="flex items-center justify-between w-full">
          {/* Item Count Badge */}
          <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white font-black text-sm">
            {category.items.length}
          </div>

          {/* Category Name */}
          <h3 className="text-2xl font-black text-white drop-shadow-lg">
            {t(category.name, category.name_en || category.name)}
          </h3>
        </div>
      </div>
    </motion.div>
  );
};

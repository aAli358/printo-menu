import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-6 px-5 py-6">
      <div className="h-[280px] rounded-[2rem] skeleton-shimmer" />

      <div className="h-14 rounded-2xl skeleton-shimmer" />

      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-24 h-10 rounded-full skeleton-shimmer shrink-0" />
        ))}
      </div>

      <div className="space-y-4 pt-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface-elevated dark:bg-neutral-900 rounded-[1.75rem] flex gap-0 border border-black/[0.04] dark:border-white/[0.06] overflow-hidden"
          >
            <div className="w-[130px] h-[148px] skeleton-shimmer shrink-0" />
            <div className="flex-1 p-5 space-y-3">
              <div className="h-4 rounded-full skeleton-shimmer w-3/4" />
              <div className="h-3 rounded-full skeleton-shimmer w-full" />
              <div className="h-3 rounded-full skeleton-shimmer w-2/3" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-6 rounded-full skeleton-shimmer w-20" />
                <div className="w-11 h-11 rounded-2xl skeleton-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import logoMark from '../../assets/logo-mark.png';

export default function BrandLogo({
  size = 'md',
  showText = true,
  subtitle = 'Growth Loop',
  className = '',
  imageClassName = '',
  containerClassName = '',
}) {
  const sizeMap = {
    xs: { container: 'w-7 h-7 rounded-lg p-0.5', img: 'w-5 h-5', text: 'text-xs' },
    sm: { container: 'w-8 h-8 rounded-lg p-1', img: 'w-6 h-6', text: 'text-sm' },
    md: { container: 'w-10 h-10 rounded-xl p-1', img: 'w-7 h-7', text: 'text-base' },
    lg: { container: 'w-16 h-12 rounded-2xl p-1.5', img: 'w-12 h-9', text: 'text-xl' },
    hero: { container: 'w-20 h-16 rounded-2xl p-2', img: 'w-16 h-12', text: 'text-2xl' },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <div
        className={`${current.container} bg-slate-900 border border-slate-800/80 flex items-center justify-center shadow-xs shrink-0 transition-all ${containerClassName}`}
      >
        <img
          src={logoMark}
          alt="WealthHabit Logo"
          className={`${current.img} object-contain ${imageClassName}`}
        />
      </div>
      {showText && (
        <div className="truncate text-left">
          <span className={`text-[#0F172A] font-extrabold ${current.text} tracking-tight block leading-tight`}>
            Wealth<span className="text-[#4F46E5]">Habit</span>
          </span>
          {subtitle && (
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import logoMark from '../../assets/logo-mark.png';

export default function Logo({
  size = 'md',
  showText = false,
  subtitle = '',
  className = '',
  imageClassName = '',
  containerClassName = '',
}) {
  const sizeMap = {
    xs: { container: 'w-7 h-7 aspect-square rounded-lg p-0.5', text: 'text-xs' },
    sm: { container: 'w-8 h-8 aspect-square rounded-lg p-1', text: 'text-sm' },
    md: { container: 'w-10 h-10 aspect-square rounded-xl p-1', text: 'text-base' },
    lg: { container: 'w-16 h-16 aspect-square rounded-2xl p-1.5', text: 'text-xl' },
    hero: { container: 'w-20 h-20 aspect-square rounded-2xl p-2', text: 'text-2xl' },
  };

  const current = sizeMap[size] || sizeMap.md;

  const iconElement = (
    <div
      className={`aspect-square flex-shrink-0 overflow-hidden flex items-center justify-center bg-[#222936] shadow-sm ${current.container} ${containerClassName || className}`}
    >
      <img
        src={logoMark}
        alt="WealthHabit Logo"
        className={`w-full h-full object-contain object-center scale-100 ${imageClassName}`}
      />
    </div>
  );

  if (!showText) {
    return iconElement;
  }

  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      {iconElement}
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
    </div>
  );
}

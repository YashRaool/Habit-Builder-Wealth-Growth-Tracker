import React from 'react';
import Logo from './Logo';

export default function BrandLogo({
  size = 'md',
  showText = true,
  subtitle = 'Growth Loop',
  className = '',
  imageClassName = '',
  containerClassName = '',
}) {
  return (
    <Logo
      size={size}
      showText={showText}
      subtitle={subtitle}
      className={className}
      containerClassName={containerClassName}
      imageClassName={imageClassName}
    />
  );
}

export { Logo };

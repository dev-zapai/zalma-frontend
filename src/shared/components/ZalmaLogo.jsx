import React from 'react';

const LOGO_FULL = `${process.env.PUBLIC_URL || ''}/zalma_logo.png`;
const LOGO_ICON = `${process.env.PUBLIC_URL || ''}/logo.png`;

export default function ZalmaLogo({
  iconOnly = false,
  height = 32,
  className = '',
}) {
  return (
    <span className={`inline-flex items-center ${className}`} aria-label="Zalma" role="img">
      <img
        src={iconOnly ? LOGO_ICON : LOGO_FULL}
        alt="Zalma"
        style={{ height: `${height}px`, width: 'auto', display: 'block' }}
      />
    </span>
  );
}

import React from 'react';

interface NookiLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const NookiLogo: React.FC<NookiLogoProps> = ({
  size = 28,
  className = '',
  showText = false,
}) => {
  return (
    <div
      className={`inline-flex items-center gap-2 select-none ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Soft rounded sprout leaf mascot */}
        <rect width="36" height="36" rx="10" fill="var(--accent-subtle)" />
        {/* Cute Cottage Sprout */}
        <path
          d="M18 28V15M18 15C18 11.5 21 8.5 26 8C26 13 22.5 15 18 15ZM18 19C18 16 15.5 13.5 11 13C11 17 14 19 18 19Z"
          stroke="var(--accent-primary)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Warm dew drop */}
        <circle cx="23.5" cy="11.5" r="1.5" fill="var(--nooki-warm-amber)" />
      </svg>
      {showText && (
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: '18px',
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}
        >
          nooki
        </span>
      )}
    </div>
  );
};

'use client';

import React from 'react';

export function Badge({
  children,
  icon,
  variant = 'default',
}: {
  children: React.ReactNode;
  icon?: string;
  variant?: 'default' | 'highlight';
}) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1,
    whiteSpace: 'nowrap' as const,
    backdropFilter: 'blur(4px)',
  };

  const variantStyle =
    variant === 'highlight'
      ? {
          background: 'rgba(236, 72, 153, 0.2)',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          color: '#f9a8d4',
        }
      : {
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'rgba(255, 255, 255, 0.9)',
        };

  return (
    <span style={{ ...baseStyle, ...variantStyle }}>
      {icon && <span style={{ fontSize: '14px' }}>{icon}</span>}
      {children}
    </span>
  );
}
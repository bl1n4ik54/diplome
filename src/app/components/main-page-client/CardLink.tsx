'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from './Badge';

export function CardLink({
  href,
  title,
  subtitle,
  coverUrl,
  badges,
  progress,
  size = 'default',
}: {
  href: string;
  title: string;
  subtitle?: string;
  coverUrl?: string | null;
  badges?: React.ReactNode;
  progress?: number;
  size?: 'small' | 'default';
}) {
  const coverSize = size === 'small' ? 48 : 64;

  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(8px)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Обложка */}
      <div
        style={{
          width: coverSize,
          height: coverSize,
          borderRadius: '16px',
          overflow: 'hidden',
          flexShrink: 0,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: 24 }}>📘</span>
        )}
      </div>

      {/* Контент */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: size === 'small' ? '14px' : '16px',
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: 'rgba(255, 255, 255, 0.95)',
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: 2,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          {badges && <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>{badges}</div>}
        </div>

        {/* Прогресс-бар */}
        {progress !== undefined && (
          <div style={{ marginTop: '6px' }}>
            <div
              style={{
                height: 4,
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #818cf8, #f472b6)',
                  borderRadius: '2px',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
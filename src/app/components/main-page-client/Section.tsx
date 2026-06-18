import React from 'react';

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '28px',
        padding: 'clamp(14px, 3vw, 20px)',
        backdropFilter: 'blur(10px)',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.95)', margin: 0 }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

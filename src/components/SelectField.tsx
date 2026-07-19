import React from 'react';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  label?: string;
  containerStyle?: React.CSSProperties;
}

/**
 * Componente Select premium reutilizable.
 * Flecha siempre visible, glassmorphism, focus glow, hover.
 * Úsalo en toda la app en lugar de <select className="input-field">.
 */
export default function SelectField({ children, label, style, id, containerStyle, ...props }: SelectFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', ...containerStyle }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: 'var(--text-secondary)',
            fontWeight: 600,
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative', width: '100%' }}>
        <select
          id={id}
          style={{
            width: '100%',
            padding: '0.75rem 2.8rem 0.75rem 1rem',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
            outline: 'none',
            ...style,
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.7)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          }}
          onMouseEnter={e => {
            if (document.activeElement !== e.currentTarget) {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }
          }}
          onMouseLeave={e => {
            if (document.activeElement !== e.currentTarget) {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }
          }}
          {...props}
        >
          {children}
        </select>

        {/* Chevron SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: 'absolute',
            right: '0.9rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '1rem',
            height: '1rem',
            pointerEvents: 'none',
            color: 'var(--text-secondary)',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}

import React from 'react';
import { Heart } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: '60px',
        padding: '24px 20px',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 500,
          color: 'var(--text-primary)',
          letterSpacing: '0.01em',
        }}
      >
        <span>Developed with</span>
        <Heart
          size={16}
          style={{
            color: '#EF4444',
            fill: '#EF4444',
            display: 'inline-block',
            animation: 'pulse 1.8s ease-in-out infinite',
            verticalAlign: 'middle',
          }}
        />
        <span>by</span>
        <a
          href="https://github.com/anshuln26"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--accent-primary)',
            fontWeight: 700,
            textDecoration: 'none',
            borderBottom: '1px dashed var(--accent-primary)',
            paddingBottom: '1px',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Anshul
        </a>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.02em',
        }}
      >
        Crafted with love and maintained by Anshul • © {CURRENT_YEAR} All Rights Reserved.
      </p>
    </footer>
  );
}

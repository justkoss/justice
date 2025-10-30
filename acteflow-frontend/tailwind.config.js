/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Gold accent colors
        gold: {
          primary: '#d4af37',
          hover: '#c19b2f',
          light: '#e5c860',
        },
        // Background colors (dark theme)
        bg: {
          primary: '#1a1f2e',
          secondary: '#252d3f',
          tertiary: '#2d3748',
          hover: '#374151',
        },
        // Border colors
        border: {
          primary: '#2d3748',
          secondary: '#374151',
          light: 'rgba(255, 255, 255, 0.1)',
        },
        // Text colors
        text: {
          primary: '#f7fafc',
          secondary: '#cbd5e0',
          tertiary: '#a0aec0',
          muted: '#718096',
        },
        // Status colors
        status: {
          pending: '#fbbf24',
          reviewing: '#60a5fa',
          rejected: '#f87171',
          stored: '#34d399',
        },
        // Semantic colors
        success: {
          DEFAULT: '#10b981',
          light: '#34d399',
          bg: 'rgba(16, 185, 129, 0.1)',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#f87171',
          bg: 'rgba(239, 68, 68, 0.1)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          bg: 'rgba(245, 158, 11, 0.1)',
        },
        info: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          bg: 'rgba(59, 130, 246, 0.1)',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        arabic: ['Noto Sans Arabic', 'Tajawal', 'Cairo', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'Courier New', 'monospace'],
      },
      fontSize: {
        xs: '0.75rem',      // 12px
        sm: '0.875rem',     // 14px
        base: '1rem',       // 16px
        lg: '1.125rem',     // 18px
        xl: '1.25rem',      // 20px
        '2xl': '1.5rem',    // 24px
        '3xl': '1.875rem',  // 30px
        '4xl': '2.25rem',   // 36px
      },
      spacing: {
        xs: '0.25rem',   // 4px
        sm: '0.5rem',    // 8px
        md: '1rem',      // 16px
        lg: '1.5rem',    // 24px
        xl: '2rem',      // 32px
        '2xl': '3rem',   // 48px
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '6px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        'gold-sm': '0 2px 4px rgba(212, 175, 55, 0.2)',
        'gold-md': '0 4px 8px rgba(212, 175, 55, 0.3)',
        'card': '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'skeleton': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'spin-slow': 'spin-slow 2s linear infinite',
        'skeleton': 'skeleton 1.5s infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

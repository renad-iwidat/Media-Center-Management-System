import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Blue Palette
        'primary': {
          'light-very': '#f0f4f8',
          'light': '#7BA5C1',
          'medium': '#6B95B1',
          'dark': '#4A7C9E',
          'darker': '#3d6a8a',
          'darkest': '#2d5570',
          'very-dark': '#1f3a4f',
          'ultra-dark': '#0f1f2e',
        },
        // Accent Orange
        'accent': {
          'light-very': '#FFF5E6',
          'light': '#FFB366',
          'main': '#FF9F4A',
          'dark': '#FF8C2E',
        },
        // Gray Scale
        'gray-custom': {
          'white': '#ffffff',
          'light-very': '#f8fafc',
          'light': '#f1f5f9',
          'light-medium': '#e2e8f0',
          'medium': '#cbd5e1',
          'dark': '#64748b',
          'dark-very': '#1e293b',
          'black': '#0b1224',
        },
        // Success Green
        'success': {
          'light': '#dcfce7',
          'medium': '#86efac',
          'dark': '#22c55e',
          'darker': '#16a34a',
        },
        // Error Red
        'error': {
          'light': '#fee2e2',
          'medium': '#fca5a5',
          'dark': '#ef4444',
          'darker': '#dc2626',
        },
        // Warning Yellow
        'warning': {
          'light': '#fef3c7',
          'medium': '#fcd34d',
          'dark': '#f59e0b',
          'darker': '#d97706',
        },
        // Info Blue
        'info': {
          'light': '#dbeafe',
          'medium': '#93c5fd',
          'dark': '#3b82f6',
          'darker': '#1d4ed8',
        },
        // Secondary Purple
        'secondary': {
          'light': '#ede9fe',
          'medium': '#d8b4fe',
          'dark': '#a855f7',
          'darker': '#7e22ce',
        },
      },
      fontFamily: {
        'arabic': ['Almarai', 'sans-serif'],
        'sans': ['Inter', 'Almarai', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['14px', { lineHeight: '1.5' }],
        'sm': ['16px', { lineHeight: '1.6' }],
        'base': ['18px', { lineHeight: '1.7' }],
        'lg': ['20px', { lineHeight: '1.7' }],
        'xl': ['22px', { lineHeight: '1.5' }],
        '2xl': ['26px', { lineHeight: '1.4' }],
        '3xl': ['30px', { lineHeight: '1.3' }],
        '4xl': ['36px', { lineHeight: '1.2' }],
        '5xl': ['42px', { lineHeight: '1.1' }],
      },
      borderRadius: {
        'xs': '12px',
        'sm': '16px',
        'md': '20px',
        'lg': '28px',
        'xl': '32px',
        'full': '50%',
      },
      boxShadow: {
        'light': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'heavy': '0 8px 24px rgba(0, 0, 0, 0.15)',
        'hover': '0 12px 32px rgba(0, 0, 0, 0.2)',
        'elevation': '0 20px 40px rgba(0, 0, 0, 0.25)',
        'inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
        'orange': '0 4px 12px rgba(255, 159, 74, 0.3)',
        'blue': '0 4px 12px rgba(61, 106, 138, 0.3)',
      },
      backgroundImage: {
        'gradient-blue-sidebar': 'linear-gradient(to bottom, #2d5570, #1f3a4f)',
        'gradient-blue-button': 'linear-gradient(to right, #3d6a8a, #2d5570)',
        'gradient-blue-topbar': 'linear-gradient(to left, #3d6a8a, #4d7a9a)',
        'gradient-orange': 'linear-gradient(to right, #FF9F4A, #FFB366)',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },
    },
  },
  plugins: [],
};

export default config;

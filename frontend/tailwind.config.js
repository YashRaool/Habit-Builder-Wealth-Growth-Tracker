/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas:  { DEFAULT: '#F1EFEA', dark: '#111318' },
        surface: { DEFAULT: '#FFFFFF', dark: '#1C1F27' },
        coral:   { DEFAULT: '#F2793D', light: '#F9956A', dark: '#C95E27' },
        ink:     { DEFAULT: '#16181D', dark: '#EDECEA' },
        mint:    { DEFAULT: '#2FA86C', light: '#5DC490' },
        rose:    { DEFAULT: '#E2574C', light: '#EA8078' },
        muted:   { DEFAULT: '#9CA3AF', dark: '#6B7280' },
        border:  { DEFAULT: '#E8E5DF', dark: '#2A2E38' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero':  ['3.5rem',  { lineHeight: '1.1', fontWeight: '800' }],
        'stat':  ['2rem',    { lineHeight: '1.2', fontWeight: '700' }],
        'label': ['0.6875rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.06em' }],
      },
      borderRadius: {
        card: '18px',
        pill: '9999px',
        gauge: '9999px',
      },
      boxShadow: {
        card:     '0 2px 16px 0 rgba(22,24,29,0.07)',
        'card-md':'0 4px 24px 0 rgba(22,24,29,0.10)',
        nav:      '0 2px 12px 0 rgba(22,24,29,0.08)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'gauge-spin': {
          from: { strokeDashoffset: '251' },
          to:   { strokeDashoffset: 'var(--dash-offset)' },
        },
      },
      animation: {
        'fade-in':    'fade-in 0.25s ease-out both',
        'gauge-fill': 'gauge-spin 1s cubic-bezier(.4,0,.2,1) both',
      },
    },
  },
  plugins: [],
};

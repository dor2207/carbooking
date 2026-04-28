/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heebo: ['Heebo', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#7C6FF7',
          50:  '#F2F1FE',
          100: '#E6E4FD',
          200: '#C9C4FA',
          300: '#ABA3F7',
          400: '#8E83F5',
          500: '#7C6FF7',
          600: '#5F55D4',
          700: '#4840A8',
          800: '#312C7C',
          900: '#1B1850',
        },
        background: '#F5F3EE',
        surface:    '#FFFFFF',
        border:     '#E8E3D8',
        textBase:   '#1A1714',
        textMuted:  '#7A7068',
        pending: {
          DEFAULT: '#F59E0B',
          light:   '#FEF3C7',
          text:    '#92400E',
          border:  '#FCD34D',
        },
        approved: {
          DEFAULT: '#059669',
          light:   '#D1FAE5',
          text:    '#065F46',
          border:  '#6EE7B7',
        },
        rejected: {
          DEFAULT: '#F43F5E',
          light:   '#FFE4E8',
          text:    '#9F1239',
          border:  '#FDA4AF',
        },
      },
      boxShadow: {
        card:   '0 1px 3px rgba(26,23,20,0.06), 0 4px 16px rgba(26,23,20,0.04)',
        'card-hover': '0 4px 12px rgba(26,23,20,0.08), 0 12px 32px rgba(26,23,20,0.06)',
        primary: '0 4px 20px rgba(124,111,247,0.35)',
        'primary-sm': '0 2px 10px rgba(124,111,247,0.25)',
      },
      animation: {
        'slide-up':   'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':    'fadeIn 0.25s ease-out',
        'bounce-in':  'bounceIn 0.45s cubic-bezier(0.34,1.56,0.64,1)',
        'scale-in':   'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        'shimmer':    'shimmer 1.8s infinite linear',
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%':   { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
    },
  },
  plugins: [],
}

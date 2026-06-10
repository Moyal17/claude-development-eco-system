/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /* ─── Colors (Otter.ai palette) ─── */
      colors: {
        brand: {
          blue:      '#144fff',
          'blue-dk': '#1D25E2',
          navy:      '#293a52',
        },
        accent: {
          cyan:   '#52d0f0',
          green:  '#19c185',
          purple: '#9b51e0',
          orange: '#f97316',
          pink:   '#ec4899',
          yellow: '#eab308',
        },
        neutral: {
          50:  '#F7F8FA',
          100: '#F1F3F5',
          200: '#E7EAEE',
          400: '#8896AA',
          500: '#8294A5',
          700: 'rgb(34, 40, 47)',
          900: '#1a1a1a',
        },
      },

      /* ─── Typography ─── */
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'Fira Mono', 'monospace'],
      },

      fontSize: {
        'hero': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'h1':   ['3rem',   { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'h2':   ['2.25rem', { lineHeight: '1.3' }],
        'h3':   ['1.5rem', { lineHeight: '1.3' }],
        'h4':   ['1.25rem', { lineHeight: '1.5' }],
      },

      /* ─── Spacing ─── */
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },

      /* ─── Max Width ─── */
      maxWidth: {
        'container-sm': '640px',
        'container-md': '768px',
        'container-lg': '1024px',
        'container-xl': '1200px',
        'container-2xl': '1440px',
      },

      /* ─── Border Radius ─── */
      borderRadius: {
        'card': '0.75rem',
        'card-lg': '1rem',
        'card-xl': '1.5rem',
      },

      /* ─── Box Shadow (Otter's exact values) ─── */
      boxShadow: {
        'navbar': '0px 1px 1px rgba(0,0,0,0.06), 8px 15px 17px rgba(0,0,0,0.05), 10px 58.5px 41px 16px rgba(24,57,89,0.07)',
        'card': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
        'card-hover': '0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)',
      },

      /* ─── Background Image (Gradients) ─── */
      backgroundImage: {
        'gradient-hot': 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #9b51e0 100%)',
        'gradient-cta': 'linear-gradient(135deg, #144fff 0%, #1D25E2 100%)',
      },

      /* ─── Transitions ─── */
      transitionTimingFunction: {
        'otter': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '400': '400ms',
      },

      /* ─── Keyframes ─── */
      keyframes: {
        'marquee': {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-100%)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(2rem)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'slider-fill': {
          from: { width: '0%' },
          to:   { width: '100%' },
        },
      },
      animation: {
        'marquee':      'marquee 80s linear infinite',
        'marquee-fast': 'marquee 36s linear infinite',
        'fade-in-up':   'fade-in-up 0.6s cubic-bezier(0.215, 0.61, 0.355, 1) forwards',
        'fade-in':      'fade-in 0.4s ease forwards',
        'scale-in':     'scale-in 0.3s cubic-bezier(0.215, 0.61, 0.355, 1) forwards',
        'slider-fill':  'slider-fill 5s linear forwards',
      },
    },

    /* ─── Breakpoints (match Otter's Webflow breakpoints) ─── */
    screens: {
      'sm':  '480px',
      'md':  '768px',
      'lg':  '992px',
      'xl':  '1200px',
      '2xl': '1505px',
    },
  },

  plugins: [],
};

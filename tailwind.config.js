/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        hangar: {
          void: '#0b1329',
          steel: '#1e293b',
          panel: '#111b33',
          signal: '#3b82f6',
          amber: '#d97706',
          sage: '#4ade80',
        },
      },
      fontFamily: {
        display: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['Barlow', '"Noto Sans SC"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        cond: ['"Barlow Condensed"', 'Barlow', 'sans-serif'],
      },
      boxShadow: {
        hangar: '0 24px 60px rgba(3, 8, 20, 0.45)',
      },
      letterSpacing: {
        brand: '0.22em',
      },
    },
  },
  plugins: [],
}

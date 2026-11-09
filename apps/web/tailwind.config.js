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
        dumline: {
          ivory: '#F7F3EA',
          charcoal: '#211C18',
          crimson: '#9E3428',
          'crimson-dark': '#7A241B',
          saffron: '#C18A3B',
          'saffron-dark': '#8C5E1A', // WCAG AA compliant on ivory
          sage: '#68735A',
          sand: '#EFE7D8',
          'sand-dark': '#D8CCB6',
          gold: '#C59A45',
          // KDS Dark Canvas Tokens
          kds: {
            bg: '#14110E',
            card: '#1F1A16',
            cardHover: '#2A231E',
            border: '#38302A',
            text: '#F5EFE6',
            muted: '#A89E94',
            green: '#22C55E',
            'green-bg': '#072712',
            amber: '#F59E0B',
            'amber-bg': '#381E04',
            crimson: '#EF4444',
            'crimson-bg': '#380909',
          },
        },
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-manrope)', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'royal': '0 20px 40px -15px rgba(33, 28, 24, 0.08), 0 0 1px 1px rgba(193, 138, 59, 0.15)',
        'royal-hover': '0 30px 60px -20px rgba(33, 28, 24, 0.15), 0 0 1px 1px rgba(193, 138, 59, 0.3)',
        'kds-card': '0 4px 12px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};


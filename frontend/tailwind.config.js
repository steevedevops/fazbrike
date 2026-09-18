/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F8E8DE',
          100: '#F8E8DE',
          500: '#C45C26',
          600: '#A3481C',
        },
        ink: '#1C1917',
        muted: '#78716C',
        canvas: '#FAF8F5',
        surface: '#FFFFFF',
        subtle: '#F3EFE8',
        sage: '#6B8F71',
        success: '#3F7D4E',
        danger: '#B42318',
        primary: {
          50: '#F8E8DE',
          100: '#F8E8DE',
          500: '#C45C26',
          600: '#A3481C',
          700: '#A3481C',
          800: '#1C1917',
          900: '#1C1917',
          950: '#1C1917',
        },
        accent: {
          500: '#C45C26',
          600: '#A3481C',
        },
        secondary: {
          500: '#6B8F71',
          600: '#55765C',
        },
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'Manrope', 'system-ui', 'sans-serif'],
        serif: ['var(--font-manrope)', 'Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        chip: '11px',
        control: '12px',
        card: '12px',
        pill: '9999px',
      },
      transitionDuration: {
        instant: '150ms',
        fast: '200ms',
      },
      boxShadow: {
        soft: '0 8px 24px 0 rgba(28, 25, 23, 0.08)',
        card: '0 4px 16px 0 rgba(28, 25, 23, 0.06)',
        sm: '0 1px 2px 0 rgba(28, 25, 23, 0.05)',
        md: '0 4px 6px -1px rgba(28, 25, 23, 0.05), 0 2px 4px -1px rgba(28, 25, 23, 0.03)',
        lg: '0 10px 15px -3px rgba(28, 25, 23, 0.05), 0 4px 6px -2px rgba(28, 25, 23, 0.02)',
        xl: '0 20px 25px -5px rgba(28, 25, 23, 0.05), 0 10px 10px -5px rgba(28, 25, 23, 0.02)',
        primary: '0 8px 24px 0 rgba(28, 25, 23, 0.08)',
        secondary: '0 4px 16px 0 rgba(28, 25, 23, 0.06)',
        accent: '0 4px 14px 0 rgba(196, 92, 38, 0.18)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'panel-in': {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
        'slide-down': 'slide-down 0.22s ease-out both',
        'panel-in': 'panel-in 0.22s ease-out both',
      },
    },
  },
  plugins: [],
}

import type { Config } from 'tailwindcss';

/**
 * Design tokens from the approved design 5. This file is the single source of
 * truth for colour, type and shape; components use these utilities only.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: { 50: '#fbf8f2', 100: '#f5efe4', 200: '#ece3d4', 300: '#dccdb4', 400: '#c4ad8a', 500: '#a68b62' },
        terracotta: { 300: '#e3a487', 400: '#d0805f', 500: '#b9603f', 600: '#984a2f', 700: '#753823' },
        majorelle: { 300: '#8fa2f0', 400: '#5d79e6', 500: '#3557d6', 600: '#2743b4', 700: '#1f348a', 800: '#18285f', 900: '#111c42' },
        zellige: { 500: '#1f7a72', 600: '#17625b' },
        brass: { 200: '#efdfb8', 300: '#e3c98f', 400: '#cfae6a', 500: '#b08d47', 600: '#8c6f35' },
        night: { 800: '#241c15', 900: '#18130f', 950: '#100c09' },
        whatsapp: '#25D366',
        ink: { DEFAULT: '#2b2119', soft: '#6b5d4f', mute: '#9a8b78' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Gloock', 'serif'],
        sans: ['var(--font-sans)', 'Instrument Sans', 'system-ui', 'sans-serif'],
        ruqaa: ['var(--font-ruqaa)', 'Aref Ruqaa', 'serif'],
      },
      borderRadius: { arch: '999px 999px 0 0' },
      backgroundImage: {
        sunset: 'linear-gradient(160deg, #f5efe4 0%, #ecd9c4 45%, #e3a487 100%)',
        'majorelle-deep': 'radial-gradient(90% 80% at 20% 0%, #3557d6 0%, #1f348a 45%, #111c42 100%)',
        'night-glow':
          'radial-gradient(70% 60% at 75% 30%, rgba(207,174,106,.16) 0%, rgba(24,19,15,0) 60%), radial-gradient(60% 50% at 10% 90%, rgba(185,96,63,.14) 0%, rgba(24,19,15,0) 60%)',
      },
    },
  },
  plugins: [],
};

export default config;

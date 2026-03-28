// /home/user/LockIn/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './store/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0D0F1A',
        surface: '#161824',
        surfaceElevated: '#1E2030',
        bdr: '#2A2D40',
        accent: '#C8F04A',
        coral: '#FF6B6B',
        success: '#4ADE80',
        warning: '#FACC15',
        textPrimary: '#FFFFFF',
        textSecondary: '#8B8FA8',
        textMuted: '#4A4D62',
        blue: '#60A5FA',
        purple: '#A78BFA',
        water: '#38BDF8',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config

import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'
import animate from 'tailwindcss-animate'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx,html}',
    './index.html',
    './floating.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#165DFF',
          500: '#165DFF',
          600: '#0E4AD9',
          700: '#0A3DBC',
        },
        ink: {
          900: '#1D2939',
          700: '#475467',
          500: '#98A2B3',
        },
        canvas: {
          start: '#F5F9FF',
          end: '#E8F1FF',
        },
        feedback: {
          success: '#5BCBA0',
          inactive: '#DDE3EE',
          warn: '#F5A623',
          error: '#E5484D',
        },
        background: 'transparent',
        foreground: '#1D2939',
        muted: { DEFAULT: '#475467', foreground: '#98A2B3' },
      },
      borderRadius: {
        glass: '16px',
        'glass-sm': '10px',
        'glass-lg': '24px',
      },
      spacing: {
        'space-1': '4px',
        'space-2': '8px',
        'space-3': '12px',
        'space-4': '16px',
        'space-5': '24px',
        'space-6': '32px',
      },
      boxShadow: {
        'primary-glow': '0 4px 12px rgba(22, 93, 255, 0.25)',
        'primary-glow-hover': '0 6px 16px rgba(22, 93, 255, 0.35)',
      },
      transitionTimingFunction: { 'soft-out': 'ease-out' },
      transitionDuration: { 250: '250ms' },
    },
  },
  plugins: [typography, animate],
}

export default config

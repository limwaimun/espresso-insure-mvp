import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        espresso: '#1C0F0A',
        dark: '#120A06',
        cream: '#F5ECD7',
        'cream-dim': '#C9B99A',
        amber: '#C8813A',
        'amber-light': '#E8A55A',
        'warm-mid': '#3D2215',
        'warm-border': '#2E1A0E',
        ok: '#5AB87A',
        danger: '#D06060',
        warning: '#D4A030',
        info: '#5A8AD4',
        teal: '#20A0A0',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      fontSize: {
        '10': '10px',
        '11': '11px',
        '12': '12px',
        '13': '13px',
        '14': '14px',
        '18': '18px',
        '32': '32px',
        '40': '40px',
      },
      borderRadius: {
        '12': '12px',
        'full': '100px',
      },
      animation: {
        'fadeUp': 'fadeUp 0.8s ease both',
        'pulse': 'pulse 2s ease infinite',
      },
      keyframes: {
        fadeUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.8)' },
        },
      },
    },
  },
  plugins: [],
}
export default config

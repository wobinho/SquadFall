import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    borderRadius: {
      none: '0',
      DEFAULT: '0',
    },
    extend: {
      colors: {
        bg:         '#0b0d10',
        bg2:        '#14171c',
        bg3:        '#1a1d22',
        bg4:        '#0f1115',
        bgDeep:     '#0a0c10',
        ink:        '#f2f0ea',
        muted:      '#8a8e96',
        dim:        '#5a5e66',
        line:       '#24282f',
        lineStrong: '#3a3f48',
        blood:      '#c53030',
        bloodLight: '#ff5555',
        warn:       '#e8a736',
        warnLight:  '#ff8833',
        success:    '#6b8a3a',
        faction: {
          ironwatch: '#6a7d5a',
          rustborn:  '#c7641c',
          ashkin:    '#b83a1e',
          verdant:   '#6b8a3a',
        },
      },
      fontFamily: {
        display: ["'Bebas Neue'", 'sans-serif'],
        accent:  ["'DM Serif Display'", 'serif'],
        body:    ["'Inter'", 'sans-serif'],
        mono:    ["'JetBrains Mono'", 'monospace'],
      },
      boxShadow: {
        active: '0 0 0 1px #f2f0ea, 0 20px 60px -20px rgba(255,255,255,0.15)',
      },
    },
  },
  plugins: [],
}

export default config

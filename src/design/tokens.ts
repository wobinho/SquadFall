export const colors = {
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
  enemyTint:  'rgba(197, 48, 48, 0.08)',
  enemyGlow:  'rgba(197, 48, 48, 0.15)',
} as const

export const factionColors = {
  ironwatch: '#6a7d5a',
  rustborn:  '#c7641c',
  ashkin:    '#b83a1e',
  verdant:   '#6b8a3a',
} as const

export type Faction = keyof typeof factionColors

export const fonts = {
  display: "'Bebas Neue', sans-serif",
  accent:  "'DM Serif Display', serif",
  body:    "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
} as const

export const typeScale = {
  heroHeader:  'clamp(40px, 6vw, 72px)',
  cardName:    '28px',
  gearName:    '16px',
  moveName:    '13px',
  sectionHead: '22px',
  passiveName: '16px',
  body:        '13px',
  desc:        '10px',
  classLabel:  '11px',
  label:       '9px',
  stat:        '11px',
  log:         '12px',
} as const

export const letterSpacing = {
  displayTight: '0.04em',
  displayWide:  '0.06em',
  labelTight:   '0.15em',
  labelWide:    '0.25em',
  accent:       '0.02em',
} as const

export const layout = {
  pageMaxWidth:   '1400px',
  pagePadding:    '40px 24px 80px',
  pageBackground: 'radial-gradient(ellipse at top, #1a1d22 0%, #0b0d10 60%)',
} as const

export const spacing = {
  xs:  '4px',
  sm:  '8px',
  md:  '12px',
  lg:  '16px',
  xl:  '20px',
  xxl: '24px',
} as const

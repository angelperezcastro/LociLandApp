export const colors = {
  primary: '#FFD93D',
  primaryBorder: '#D9B51F',

  secondary: '#6BCB77',
  secondaryBorder: '#4FA75A',

  accent: '#4D96FF',
  accentSoft: '#EAF3FF',

  emphasis: '#FF6B6B',
  emphasisSoft: '#FFE8E8',

  bg: '#FFFBF0',
  text: '#2D3436',

  white: '#FFFFFF',
  black: '#000000',

  card: '#FFFFFF',
  border: '#E6DDCA',
  borderStrong: '#D7C9AC',

  muted: '#7C8793',
  shadow: '#1F2937',

  homeBackground: '#FFF9E8',
  softYellow: '#FFE7A3',

  surface: '#FFFFFF',

  overlay: 'rgba(45, 52, 54, 0.24)',
} as const;

export type AppColors = typeof colors;
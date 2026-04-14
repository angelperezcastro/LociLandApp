export const colors = {
  primary: '#FFD93D',
  secondary: '#6BCB77',
  accent: '#4D96FF',
  emphasis: '#FF6B6B',
  bg: '#FFFBF0',
  text: '#2D3436',

  white: '#FFFFFF',
  black: '#000000',

  success: '#6BCB77',
  warning: '#FFD93D',
  danger: '#FF6B6B',
  info: '#4D96FF',

  muted: '#A8B0B9',
  border: '#E9E3D5',
  card: '#FFFFFF',
} as const;

export type AppColors = typeof colors;
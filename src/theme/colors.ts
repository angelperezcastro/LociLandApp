// src/theme/colors.ts

export const colors = {
  primary: '#FFD93D',
  secondary: '#6BCB77',
  accent: '#4D96FF',
  emphasis: '#FF6B6B',

  bg: '#FFFBF0',
  surface: '#FFFFFF',
  surfaceSoft: '#FFF7DF',
  surfaceMuted: '#F7EBCB',

  text: '#2D3436',
  textSoft: '#586267',
  muted: '#7A7A7A',

  border: '#E9DFC7',
  borderStrong: '#D8C89D',

  success: '#6BCB77',
  warning: '#FFB703',
  danger: '#FF6B6B',
  info: '#4D96FF',

  primarySoft: '#FFF0A6',
  secondarySoft: '#DDF8E1',
  accentSoft: '#DDEBFF',
  emphasisSoft: '#FFE0E0',
  warningSoft: '#FFF1C2',

  disabled: '#D8D8D8',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  overlay: 'rgba(45, 52, 54, 0.4)',
  shadow: 'rgba(45, 52, 54, 0.18)',

  /**
   * Backward-compatible aliases.
   * Keep these for now because existing screens already use them.
   * We can gradually replace them during the visual audit.
   */
  card: '#FFFFFF',
  homeBackground: '#FFFBF0',
  softYellow: '#FFF0A6',
  softGreen: '#DDF8E1',
  softBlue: '#DDEBFF',
  softRed: '#FFE0E0',
} as const;

export type ColorToken = keyof typeof colors;
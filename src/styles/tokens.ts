/**
 * Бренд-токены FootureX для кода (WebGL, графики). Совпадают с CSS-переменными
 * в src/styles/index.css. Источник — брендбук FootureX.
 */
export const colors = {
  ink: '#0B0F0E',
  deep: '#070A12',
  surface: '#0E1629',
  line: '#273B51',
  primary: '#2550FA',
  secondary: '#2593FA',
  highlight: '#8EB4FF',
  ice: '#DCE7FF',
  text: '#FFFFFF',
  soft: '#B8C1D4',
  mute: '#8A93A6',
} as const;

export const gradients = {
  brand: 'linear-gradient(135deg, #2593FA 0%, #2550FA 100%)',
} as const;

/** Последовательная палитра для категорий графиков — от яркого к светлому, в рамках бренда. */
export const chartPalette = ['#2550FA', '#2593FA', '#8EB4FF', '#DCE7FF', '#5B6B88'] as const;

export const fonts = {
  display: "'Zen Dots', 'Unbounded', system-ui, sans-serif",
  body: "'Poppins', 'Montserrat', system-ui, sans-serif",
} as const;

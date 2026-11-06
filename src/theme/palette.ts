/**
 * Tuwaiq Club palette (JS copy used by the canvas particles).
 * The CSS source of truth lives in src/styles/index.css (@theme block).
 * Keep both in sync if you change a color.
 */
export const PALETTE = {
  ink: '#080611',
  deep: '#190B3D',
  violet: '#2D1168',
  purple: '#6F2CFF',
  electric: '#9B5CFF',
  lavender: '#C5A3FF',
  cyan: '#35D9FF',
  snow: '#F5F2FF',
} as const;

/** Per-committee accent colors. */
export const ACCENTS = {
  electricPurple: '#A66BFF',
  cyanBlue: '#35D9FF',
  lavender: '#C5A3FF',
  turquoise: '#22E5C3',
  warmOrange: '#FF9A3C',
} as const;

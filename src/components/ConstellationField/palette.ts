/**
 * Colour palettes for the Living Constellation field. Two candidates are kept
 * side by side so we can compare them live: `noir` (warm gold on near-black,
 * from the sacred-light-noir reference) and `blue` (cool midnight-blue, our
 * current look). Choose with the `?palette=` query param; noir is the default.
 *
 * A glow stop is [offset, 'r,g,b', baseAlpha]; the draw loop multiplies the
 * alpha by the point's live brightness before painting.
 */
export type Stop = [number, string, number]

export type Palette = {
  id: 'noir' | 'blue'
  base: string
  atmosphere: string
  dustRgb: string
  rippleRgb: string
  rippleAlpha: number
  source: { glow: Stop[]; core: { rgb: string; alpha: number } }
  point: { glow: Stop[]; coreRgb: string }
}

const NOIR: Palette = {
  id: 'noir',
  base: '#0a0a0c',
  atmosphere:
    'radial-gradient(ellipse at 50% 48%, rgba(212,175,55,0.10) 0%, transparent 44%), radial-gradient(ellipse at 50% 50%, #15131a 0%, #0a0a0c 60%)',
  dustRgb: '212,175,55',
  rippleRgb: '212,175,55',
  rippleAlpha: 0.24,
  source: {
    glow: [
      [0, '255,250,235', 0.95],
      [0.2, '240,217,140', 0.55],
      [0.5, '212,175,55', 0.2],
      [1, '212,175,55', 0],
    ],
    core: { rgb: '255,250,238', alpha: 0.9 },
  },
  point: {
    glow: [
      [0, '255,250,235', 0.5],
      [0.3, '240,217,140', 0.32],
      [1, '212,175,55', 0],
    ],
    coreRgb: '248,240,220',
  },
}

const BLUE: Palette = {
  id: 'blue',
  base: '#070a14',
  atmosphere: 'radial-gradient(circle at 50% 48%, #17305e 0%, #0b1428 34%, #070a14 68%)',
  dustRgb: '160,190,255',
  rippleRgb: '245,215,122',
  rippleAlpha: 0.22,
  source: {
    glow: [
      [0, '255,255,255', 0.95],
      [0.25, '245,215,122', 0.6],
      [1, '245,215,122', 0],
    ],
    core: { rgb: '255,255,255', alpha: 0.85 },
  },
  point: {
    glow: [
      [0, '255,255,255', 0.5],
      [0.3, '245,215,122', 0.35],
      [1, '245,215,122', 0],
    ],
    coreRgb: '255,253,245',
  },
}

/** Pick the palette from `?palette=`; defaults to noir. */
export function getPalette(): Palette {
  if (typeof window === 'undefined') return NOIR
  return new URLSearchParams(window.location.search).get('palette') === 'blue' ? BLUE : NOIR
}

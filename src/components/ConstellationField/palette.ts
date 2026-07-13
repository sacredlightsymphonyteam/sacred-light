/**
 * Colour palettes for the Living Constellation field. Candidates are kept side
 * by side so we can compare them live via the `?palette=` query param:
 *   galaxy (default) — deep blue-black space + soft blue nebula, warm gold-white
 *                      stars (imitates the real colour of a galaxy/night sky)
 *   noir             — warm gold on near-black (sacred-light-noir reference)
 *   blue             — the earlier bright midnight-blue look
 *
 * A glow stop is [offset, 'r,g,b', baseAlpha]; the draw loop multiplies the
 * alpha by the point's live brightness before painting.
 */
export type Stop = [number, string, number]

export type Palette = {
  id: 'galaxy' | 'noir' | 'blue'
  base: string
  atmosphere: string
  dustRgb: string
  rippleRgb: string
  rippleAlpha: number
  source: { glow: Stop[]; core: { rgb: string; alpha: number } }
  point: { glow: Stop[]; coreRgb: string }
}

// Deep space: cool blue-black field + faint blue nebula, but the source and the
// points of light stay warm gold-white — the space is blue, the lights are not.
const GALAXY: Palette = {
  id: 'galaxy',
  base: '#060a16',
  atmosphere:
    'radial-gradient(ellipse at 50% 46%, rgba(150,180,240,0.07) 0%, transparent 42%), radial-gradient(ellipse at 50% 50%, #0e1d3a 0%, #0a1428 32%, #060a16 66%)',
  dustRgb: '150,178,235',
  rippleRgb: '245,215,122',
  rippleAlpha: 0.2,
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

/** Pick the palette from `?palette=`; defaults to galaxy. */
export function getPalette(): Palette {
  if (typeof window === 'undefined') return GALAXY
  const p = new URLSearchParams(window.location.search).get('palette')
  if (p === 'blue') return BLUE
  if (p === 'noir') return NOIR
  return GALAXY
}

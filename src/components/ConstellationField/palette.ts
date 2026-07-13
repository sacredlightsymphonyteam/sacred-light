/**
 * Colour palette for the Living Constellation field: `galaxy` — a near-black,
 * blue-tinted deep-space field with a soft blue nebula glow and blue star-dust,
 * and warm gold-white source + points of light. The space is blue, the lights
 * are warm — imitating the real colour of a galaxy / night sky.
 *
 * A glow stop is [offset, 'r,g,b', baseAlpha]; the draw loop multiplies the
 * alpha by the point's live brightness before painting.
 */
export type Stop = [number, string, number]

export type Palette = {
  base: string
  atmosphere: string
  dustRgb: string
  rippleRgb: string
  rippleAlpha: number
  source: { glow: Stop[]; core: { rgb: string; alpha: number } }
  point: { glow: Stop[]; coreRgb: string }
}

export const CONSTELLATION_PALETTE: Palette = {
  base: '#02040a',
  atmosphere:
    'radial-gradient(ellipse at 50% 47%, rgba(130,165,230,0.05) 0%, transparent 36%), radial-gradient(ellipse at 50% 50%, #08132a 0%, #040a18 28%, #02040a 58%)',
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

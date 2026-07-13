import { useEffect, useRef } from 'react'
import { getConstellationLights, type ConstellationLight } from '../../lib/supabase'
import styles from './ConstellationField.module.css'

/**
 * The Living Constellation field (Phase 2, Step 2 — the visible field).
 *
 * A canvas cosmic field matching Marie's video: near-black blue-black ground,
 * a decorative starfield of cool blue/white twinkling stars for depth, the
 * blue "Tina" cross of light at the heart, and — layered on top — the real
 * contributor points of light in warm gold (one per approved message, at their
 * seeded positions). Gentle drift + slow zoom + breathing keep it alive.
 *
 * Hover / click / personal-URL zoom come in the next step; positions of the
 * real points are already computed here so hit-testing can hook in later.
 */
type DecoStar = {
  x: number // normalised 0..1
  y: number
  r: number // px radius
  cool: boolean // blue vs white
  phase: number
  speed: number
  depth: number // parallax factor 0..1
}

export default function ConstellationField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lightsRef = useRef<ConstellationLight[]>([])

  useEffect(() => {
    void getConstellationLights().then((l) => {
      lightsRef.current = l
    })

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Deterministic decorative starfield (seeded → stable across reloads).
    const rand = mulberry32(20260707)
    const stars: DecoStar[] = Array.from({ length: 340 }, () => ({
      x: rand(),
      y: rand(),
      r: 0.4 + rand() * 1.5,
      cool: rand() < 0.7,
      phase: rand() * Math.PI * 2,
      speed: 0.25 + rand() * 0.7,
      depth: 0.15 + rand() * 0.85,
    }))

    let w = 0
    let h = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const start = performance.now()
    let raf = 0

    const draw = (now: number) => {
      const t = reduce ? 0 : (now - start) / 1000

      // Ground
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#08070A'
      ctx.fillRect(0, 0, w, h)

      // Gentle camera: slow drift + subtle zoom breathing
      const driftX = Math.sin(t * 0.05) * 14
      const driftY = Math.cos(t * 0.04) * 10
      const zoom = 1 + Math.sin(t * 0.03) * 0.02

      ctx.globalCompositeOperation = 'lighter'

      // Decorative starfield (cool blue/white), parallax by depth
      for (const s of stars) {
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase))
        const sx = s.x * w + driftX * s.depth
        const sy = s.y * h + driftY * s.depth
        const r = s.r * zoom
        const col = s.cool ? '180, 210, 255' : '255, 255, 255'
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4)
        g.addColorStop(0, `rgba(${col}, ${tw})`)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(sx, sy, r * 4, 0, Math.PI * 2)
        ctx.fill()
      }

      // The blue "Tina" cross of light — the heart of the field
      drawCross(ctx, w / 2 + driftX * 0.3, h * 0.46 + driftY * 0.3, Math.min(w, h) * 0.42 * zoom, t)

      // Real contributor points — warm gold, breathing, on top
      for (let i = 0; i < lightsRef.current.length; i++) {
        const p = lightsRef.current[i]
        const breath = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.6 + i * 1.7))
        const px = p.constellation_x * w + driftX * 0.5
        const py = p.constellation_y * h + driftY * 0.5
        drawGoldPoint(ctx, px, py, breath * zoom)
      }

      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
}

/** Warm-gold contributor point: bright core + soft gold glow. */
function drawGoldPoint(ctx: CanvasRenderingContext2D, x: number, y: number, a: number) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 16)
  glow.addColorStop(0, `rgba(255, 224, 170, ${a})`)
  glow.addColorStop(0.35, `rgba(183, 154, 99, ${a * 0.55})`)
  glow.addColorStop(1, 'rgba(183,154,99,0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(x, y, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = `rgba(255, 240, 210, ${Math.min(1, a + 0.2)})`
  ctx.beginPath()
  ctx.arc(x, y, 2.2, 0, Math.PI * 2)
  ctx.fill()
}

/** The blue diffraction cross (X) with a bright core and a slow pulse. */
function drawCross(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, t: number) {
  const pulse = 0.85 + 0.15 * (0.5 + 0.5 * Math.sin(t * 0.5))
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(Math.PI / 4) // makes the beams read as an X

  // Two crossed beams (horizontal + vertical after the 45° rotation)
  for (let k = 0; k < 2; k++) {
    ctx.save()
    ctx.rotate((k * Math.PI) / 2)
    const grad = ctx.createLinearGradient(-size, 0, size, 0)
    grad.addColorStop(0, 'rgba(120,180,255,0)')
    grad.addColorStop(0.5, `rgba(150,200,255,${0.5 * pulse})`)
    grad.addColorStop(1, 'rgba(120,180,255,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(-size, 0)
    ctx.lineTo(0, -size * 0.06)
    ctx.lineTo(size, 0)
    ctx.lineTo(0, size * 0.06)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  // Core glow
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.18)
  core.addColorStop(0, `rgba(255,255,255,${0.95 * pulse})`)
  core.addColorStop(0.4, `rgba(190,220,255,${0.6 * pulse})`)
  core.addColorStop(1, 'rgba(120,180,255,0)')
  ctx.fillStyle = core
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** Small seeded PRNG so the decorative field is identical on every load. */
function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

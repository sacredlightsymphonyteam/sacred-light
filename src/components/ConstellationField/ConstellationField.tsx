import { useEffect, useRef } from 'react'
import { getConstellationLights, type ConstellationLight } from '../../lib/supabase'
import styles from './ConstellationField.module.css'

/**
 * The Living Constellation field (Phase 2). Per the brief, EVERY point of light
 * is one approved message — there is no decorative fake starfield. A blue
 * "Tina" cross of light sits at the heart (from Marie's video), with a faint
 * atmospheric haze for depth. The real contributor points glow warm gold, each
 * breathing/twinkling, at their seeded positions. So the number of glowing
 * points always equals the number of messages, and grows with the Book.
 *
 * Hover / click / personal-URL zoom arrive in the next step.
 */
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
      const t = (now - start) / 1000

      // Ground + faint atmospheric haze (depth only — not countable stars)
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = '#08070A'
      ctx.fillRect(0, 0, w, h)
      drawHaze(ctx, w, h, reduce ? 0 : t)

      const driftX = reduce ? 0 : Math.sin(t * 0.06) * 16
      const driftY = reduce ? 0 : Math.cos(t * 0.05) * 12

      ctx.globalCompositeOperation = 'lighter'

      // The blue "Tina" cross — the heart of the field
      drawCross(ctx, w / 2 + driftX * 0.3, h * 0.46 + driftY * 0.3, Math.min(w, h) * 0.4, reduce ? 0 : t)

      // Real contributor points — one glowing gold light per message
      const lights = lightsRef.current
      for (let i = 0; i < lights.length; i++) {
        const p = lights[i]
        // clear, visible twinkle (0.45 → 1.0) with a per-light phase
        const tw = reduce ? 0.9 : 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.1 + i * 2.3))
        const px = p.constellation_x * w + driftX * 0.6
        const py = p.constellation_y * h + driftY * 0.6
        drawLight(ctx, px, py, tw)
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

/** Faint blue atmospheric clouds for depth — deliberately not distinct stars. */
function drawHaze(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.globalCompositeOperation = 'lighter'
  const blobs = [
    [0.3, 0.4, 0.55],
    [0.7, 0.55, 0.45],
    [0.5, 0.7, 0.4],
  ]
  for (let i = 0; i < blobs.length; i++) {
    const [bx, by, br] = blobs[i]
    const drift = Math.sin(t * 0.04 + i) * 0.01
    const cx = (bx + drift) * w
    const cy = by * h
    const r = br * Math.min(w, h)
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, 'rgba(30, 50, 90, 0.10)')
    g.addColorStop(1, 'rgba(8, 7, 10, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** One message = one glowing gold light: halo + sparkle + bright core. */
function drawLight(ctx: CanvasRenderingContext2D, x: number, y: number, a: number) {
  ctx.save()
  ctx.translate(x, y)

  // Warm gold halo
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 26)
  halo.addColorStop(0, `rgba(255, 224, 170, ${0.85 * a})`)
  halo.addColorStop(0.3, `rgba(200, 160, 90, ${0.45 * a})`)
  halo.addColorStop(1, 'rgba(183,154,99,0)')
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(0, 0, 26, 0, Math.PI * 2)
  ctx.fill()

  // Soft 4-point sparkle
  ctx.rotate(Math.PI / 4)
  for (let k = 0; k < 2; k++) {
    ctx.rotate(Math.PI / 2)
    const len = 22
    const g = ctx.createLinearGradient(-len, 0, len, 0)
    g.addColorStop(0, 'rgba(255,224,170,0)')
    g.addColorStop(0.5, `rgba(255,236,200,${0.6 * a})`)
    g.addColorStop(1, 'rgba(255,224,170,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(-len, 0)
    ctx.lineTo(0, -1.3)
    ctx.lineTo(len, 0)
    ctx.lineTo(0, 1.3)
    ctx.closePath()
    ctx.fill()
  }
  ctx.rotate(-Math.PI / 4)

  // Bright core
  ctx.fillStyle = `rgba(255, 246, 226, ${Math.min(1, a + 0.15)})`
  ctx.beginPath()
  ctx.arc(0, 0, 2.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** The blue diffraction cross (X) with a bright core and a slow pulse. */
function drawCross(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, t: number) {
  const pulse = 0.8 + 0.2 * (0.5 + 0.5 * Math.sin(t * 0.5))
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(Math.PI / 4)
  for (let k = 0; k < 2; k++) {
    ctx.rotate(Math.PI / 2)
    const grad = ctx.createLinearGradient(-size, 0, size, 0)
    grad.addColorStop(0, 'rgba(120,180,255,0)')
    grad.addColorStop(0.5, `rgba(160,205,255,${0.6 * pulse})`)
    grad.addColorStop(1, 'rgba(120,180,255,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(-size, 0)
    ctx.lineTo(0, -size * 0.05)
    ctx.lineTo(size, 0)
    ctx.lineTo(0, size * 0.05)
    ctx.closePath()
    ctx.fill()
  }
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.2)
  core.addColorStop(0, `rgba(255,255,255,${0.98 * pulse})`)
  core.addColorStop(0.4, `rgba(190,220,255,${0.65 * pulse})`)
  core.addColorStop(1, 'rgba(120,180,255,0)')
  ctx.fillStyle = core
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

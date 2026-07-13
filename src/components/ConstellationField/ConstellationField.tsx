import { useEffect, useRef } from 'react'
import { getConstellationLights, type ConstellationLight } from '../../lib/supabase'
import styles from './ConstellationField.module.css'

/**
 * The Living Constellation field. Every point of light is one approved message
 * (no decorative fake stars). The blue "Tina" cross is the luminous source at
 * the heart; each message light is BORN from the source and ripples outward to
 * its seeded position, then settles into a gentle gold twinkle — so the field
 * feels alive and literally grows one light per message. Faint blue dust adds
 * depth. (Aesthetic adapted from the earlier Sacred Light constellation.)
 */
type Star = {
  x: number
  y: number
  tx: number
  ty: number
  r: number
  born: number
  tw: number
  sp: number
}
type Ripple = { t: number; to: { x: number; y: number } }
type Dust = { x: number; y: number; r: number; tw: number; sp: number }

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
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let W = 0
    let H = 0
    let cx = 0
    let cy = 0
    const resize = () => {
      W = canvas.width = Math.round(canvas.clientWidth * dpr)
      H = canvas.height = Math.round(canvas.clientHeight * dpr)
      cx = W / 2
      cy = H * 0.46
    }
    resize()
    window.addEventListener('resize', resize)

    // Faint blue dust — depth only, not countable "stars".
    const dust: Dust[] = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: (Math.random() * 0.8 + 0.3) * dpr,
      tw: Math.random() * Math.PI * 2,
      sp: Math.random() * 0.6 + 0.2,
    }))

    const stars: Star[] = []
    const ripples: Ripple[] = []
    let built = false

    const start = performance.now()
    let raf = 0

    const draw = (now: number) => {
      // Build the message lights once they've loaded — each born from the
      // centre, staggered, and rippling out to its seeded position.
      if (!built && lightsRef.current.length) {
        lightsRef.current.forEach((p, i) => {
          const tx = p.constellation_x * W
          const ty = p.constellation_y * H
          const born = now + i * 320
          stars.push({
            x: cx,
            y: cy,
            tx,
            ty,
            r: (Math.random() * 1.6 + 1.6) * dpr,
            born,
            tw: Math.random() * Math.PI * 2,
            sp: Math.random() * 0.9 + 0.5,
          })
          ripples.push({ t: born, to: { x: tx, y: ty } })
        })
        built = true
      }

      // Ground + faint central atmosphere
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = '#08070A'
      ctx.fillRect(0, 0, W, H)
      const atm = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.6)
      atm.addColorStop(0, 'rgba(24, 38, 72, 0.5)')
      atm.addColorStop(0.4, 'rgba(14, 20, 40, 0.25)')
      atm.addColorStop(1, 'rgba(8, 7, 10, 0)')
      ctx.fillStyle = atm
      ctx.fillRect(0, 0, W, H)

      const t = reduce ? 0 : now / 1000
      ctx.globalCompositeOperation = 'lighter'

      // Dust
      for (const d of dust) {
        d.tw += reduce ? 0 : 0.01 * d.sp
        const a = 0.1 + Math.sin(d.tw) * 0.06
        ctx.beginPath()
        ctx.arc(d.x * W, d.y * H, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(160,190,255,${a})`
        ctx.fill()
      }

      // Ripples from the source to each newborn light
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i]
        const age = (now - rp.t) / 1000
        if (age < 0) continue
        if (age > 1.6) {
          ripples.splice(i, 1)
          continue
        }
        const prog = age / 1.6
        const r = Math.max(0.01, prog * Math.hypot(rp.to.x - cx, rp.to.y - cy))
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(245,215,122,${(1 - prog) * 0.22})`
        ctx.lineWidth = 1 * dpr
        ctx.stroke()
      }

      // The blue "Tina" cross — the source at the heart
      drawCross(ctx, cx, cy, Math.min(W, H) * 0.4, t, dpr)

      // Message lights: ease out from the source, then gently twinkle
      for (const s of stars) {
        if (now < s.born) continue
        const age = (now - s.born) / 1000
        const ease = Math.min(1, age / 1.4)
        const e = 1 - Math.pow(1 - ease, 3)
        s.x += (s.tx - s.x) * 0.06
        s.y += (s.ty - s.y) * 0.06
        s.tw += reduce ? 0 : 0.02 * s.sp
        const tw = reduce ? 0.95 : 0.6 + Math.sin(s.tw) * 0.4
        drawLight(ctx, s.x, s.y, s.r, tw * e, dpr)
      }

      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
    // start referenced to keep t stable across resizes
    void start
  }, [])

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
}

/** One message = one glowing gold light: gold halo + bright white core. */
function drawLight(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number, dpr: number) {
  const R = Math.max(0.01, r)
  const g = ctx.createRadialGradient(x, y, 0, x, y, R * 7)
  g.addColorStop(0, `rgba(255,255,255,${0.55 * a})`)
  g.addColorStop(0.3, `rgba(245,215,122,${0.4 * a})`)
  g.addColorStop(1, 'rgba(245,215,122,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, R * 7, 0, Math.PI * 2)
  ctx.fill()
  // sparkle
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(Math.PI / 4)
  for (let k = 0; k < 2; k++) {
    ctx.rotate(Math.PI / 2)
    const len = R * 6
    const sg = ctx.createLinearGradient(-len, 0, len, 0)
    sg.addColorStop(0, 'rgba(255,236,200,0)')
    sg.addColorStop(0.5, `rgba(255,240,210,${0.5 * a})`)
    sg.addColorStop(1, 'rgba(255,236,200,0)')
    ctx.fillStyle = sg
    ctx.beginPath()
    ctx.moveTo(-len, 0)
    ctx.lineTo(0, -0.8 * dpr)
    ctx.lineTo(len, 0)
    ctx.lineTo(0, 0.8 * dpr)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
  // core
  ctx.beginPath()
  ctx.arc(x, y, R, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(255,253,245,${a})`
  ctx.fill()
}

/** The blue diffraction cross (X) source, with a bright core and slow pulse. */
function drawCross(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, t: number, dpr: number) {
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
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.22)
  core.addColorStop(0, `rgba(255,255,255,${0.98 * pulse})`)
  core.addColorStop(0.4, `rgba(190,220,255,${0.65 * pulse})`)
  core.addColorStop(1, 'rgba(120,180,255,0)')
  ctx.fillStyle = core
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.22, 0, Math.PI * 2)
  ctx.fill()
  void dpr
  ctx.restore()
}

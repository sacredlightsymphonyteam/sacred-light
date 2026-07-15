import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getConstellationLights, type ConstellationLight } from '../../lib/supabase'
import { CONSTELLATION_PALETTE } from './palette'
import styles from './ConstellationField.module.css'

// Layout effect on the client (so tooltip clamping happens before paint, no
// flicker); plain effect during pre-render where there's no DOM to measure.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * The Living Constellation field — styled after the earlier Sacred Light
 * constellation: a warm white-gold SOURCE at the heart, and points of light
 * born from it that ripple outward and settle into a gentle gold breath,
 * over a deep midnight-blue field with faint blue dust. Every point is one
 * approved message (no decorative fake points); the field grows one light per
 * message.
 *
 * STATE 2 (exploration): hovering a point brightens it and shows a small
 * `FIRST NAME · COUNTRY` tooltip; clicking a point calls `onSelect` so the page
 * can open the message panel (and the field dims while it's open).
 *
 * STATE 3 (personal URL): when `focusRef` is a light's reference, the field
 * eases a camera zoom in to that point (which glows gold), then calls
 * `onFocusReady` so the page can auto-open its panel. `onFocusReady(null)` fires
 * if the reference isn't among the approved lights.
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
  light: ConstellationLight
}
type Ripple = { t: number; to: { x: number; y: number } }
type Dust = { x: number; y: number; r: number; tw: number; sp: number }
type Tip = { x: number; y: number; text: string }

export default function ConstellationField({
  onSelect,
  dimmed = false,
  focusRef = null,
  onFocusReady,
}: {
  onSelect?: (light: ConstellationLight) => void
  dimmed?: boolean
  focusRef?: string | null
  onFocusReady?: (light: ConstellationLight | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const atmosphereRef = useRef<HTMLDivElement>(null)
  const lightsRef = useRef<ConstellationLight[]>([])
  const hoveredRef = useRef<Star | null>(null)
  const dimmedRef = useRef(dimmed)
  const tipRef = useRef<HTMLDivElement>(null)
  // Camera for the personal-URL zoom; identity (s=1, centred) at rest.
  const camRef = useRef({ s: 1, fx: 0, fy: 0 })
  const focusRefRef = useRef<string | null>(focusRef)
  const onFocusReadyRef = useRef(onFocusReady)
  const [tip, setTip] = useState<Tip | null>(null)

  useEffect(() => {
    dimmedRef.current = dimmed
  }, [dimmed])
  useEffect(() => {
    focusRefRef.current = focusRef
  }, [focusRef])
  useEffect(() => {
    onFocusReadyRef.current = onFocusReady
  }, [onFocusReady])

  // Keep the hover tooltip fully on-screen: shift it horizontally if it would
  // spill past a viewport edge, and flip it below the point if it's near the top.
  useIsoLayoutEffect(() => {
    const el = tipRef.current
    if (!el || !tip) return
    const pad = 8
    el.style.transform = 'translate(-50%, calc(-100% - 12px))'
    const rect = el.getBoundingClientRect()
    let dx = 0
    if (rect.left < pad) dx = pad - rect.left
    else if (rect.right > window.innerWidth - pad) dx = window.innerWidth - pad - rect.right
    const below = rect.top < pad
    el.style.transform = `translate(calc(-50% + ${dx}px), ${below ? '12px' : 'calc(-100% - 12px)'})`
  }, [tip])

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
    const palette = CONSTELLATION_PALETTE
    if (atmosphereRef.current) atmosphereRef.current.style.background = palette.atmosphere

    let W = 0
    let H = 0
    let cx = 0
    let cy = 0
    // Personal-URL focus state (set once lights are built).
    const cam = camRef.current
    let focusStar: Star | null = null
    let focusStart = 0 // timestamp to begin the zoom; 0 = not scheduled
    let readyFired = false
    const FOCUS_SCALE = 3 // brief: 3× zoom on the personal URL point
    const FOCUS_DELAY = 1500
    const resize = () => {
      W = canvas.width = Math.round(canvas.clientWidth * dpr)
      H = canvas.height = Math.round(canvas.clientHeight * dpr)
      cx = W / 2
      cy = H * 0.48
      if (!focusStar) {
        cam.s = 1
        cam.fx = W / 2
        cam.fy = H / 2
      }
    }
    resize()
    window.addEventListener('resize', resize)

    const sourceBaseR = 9 * dpr
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
    let raf = 0

    // Distance (device px) within which a point counts as hovered/clicked.
    const hitRadius = (s: Star) => Math.max(s.r * 6, 16 * dpr)

    const starAt = (clientX: number, clientY: number): Star | null => {
      const rect = canvas.getBoundingClientRect()
      // Screen (device px) → world, inverting the current camera transform.
      const sx = (clientX - rect.left) * dpr
      const sy = (clientY - rect.top) * dpr
      const mx = (sx - W / 2) / cam.s + cam.fx
      const my = (sy - H / 2) / cam.s + cam.fy
      let best: Star | null = null
      let bestD = Infinity
      for (const s of stars) {
        const d = Math.hypot(mx - s.x, my - s.y)
        if (d < bestD) {
          bestD = d
          best = s
        }
      }
      return best && bestD <= hitRadius(best) ? best : null
    }

    const onMove = (e: MouseEvent) => {
      const s = starAt(e.clientX, e.clientY)
      hoveredRef.current = s
      canvas.style.cursor = s ? 'pointer' : 'default'
      if (s) {
        const rect = canvas.getBoundingClientRect()
        const first = (s.light.name || '').trim().split(/\s+/)[0] || 'A light'
        const country = s.light.country ? ` · ${s.light.country}` : ''
        // World → screen through the current camera transform.
        const screenX = W / 2 + cam.s * (s.x - cam.fx)
        const screenY = H / 2 + cam.s * (s.y - cam.fy)
        setTip({
          x: rect.left + screenX / dpr,
          y: rect.top + screenY / dpr,
          text: `${first}${country}`,
        })
      } else {
        setTip(null)
      }
    }
    const onLeave = () => {
      hoveredRef.current = null
      canvas.style.cursor = 'default'
      setTip(null)
    }
    const onClick = (e: MouseEvent) => {
      const s = starAt(e.clientX, e.clientY)
      if (s && onSelect) {
        setTip(null)
        onSelect(s.light)
      }
    }
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)
    canvas.addEventListener('click', onClick)

    const draw = (now: number) => {
      // Build one point per message once loaded — born from the source, staggered.
      if (!built && lightsRef.current.length) {
        // Inset positions a little so no point (or its tooltip) hugs the edge.
        const MARGIN = 0.06
        lightsRef.current.forEach((p, i) => {
          const tx = (MARGIN + p.constellation_x * (1 - 2 * MARGIN)) * W
          const ty = (MARGIN + p.constellation_y * (1 - 2 * MARGIN)) * H
          const born = now + i * 320
          stars.push({
            x: cx,
            y: cy,
            tx,
            ty,
            r: (Math.random() * 1.6 + 1.4) * dpr,
            born,
            tw: Math.random() * Math.PI * 2,
            sp: Math.random() * 0.9 + 0.4,
            light: p,
          })
          ripples.push({ t: born, to: { x: tx, y: ty } })
        })
        built = true
        // Personal URL: find the requested light and schedule the zoom-in.
        if (focusRefRef.current) {
          const want = focusRefRef.current.toUpperCase()
          focusStar = stars.find((s) => s.light.light_reference?.toUpperCase() === want) ?? null
          focusStart = now + FOCUS_DELAY
        }
      }

      // Camera: ease toward the focused point after a beat (personal URL), or
      // back out to the whole field when focus is released (panel closed).
      const focusActive = !!focusRefRef.current
      const wantFocus = focusActive && !!focusStar && focusStart > 0 && now >= focusStart
      const tS = wantFocus ? FOCUS_SCALE : 1
      const tfx = wantFocus && focusStar ? focusStar.tx : W / 2
      const tfy = wantFocus && focusStar ? focusStar.ty : H / 2
      cam.s += (tS - cam.s) * 0.045
      cam.fx += (tfx - cam.fx) * 0.045
      cam.fy += (tfy - cam.fy) * 0.045
      if (focusActive && focusStart > 0 && now >= focusStart && !readyFired) {
        if (focusStar) {
          // Open the panel once the zoom has mostly arrived.
          if (cam.s > FOCUS_SCALE * 0.86) {
            readyFired = true
            onFocusReadyRef.current?.(focusStar.light)
          }
        } else {
          readyFired = true
          onFocusReadyRef.current?.(null) // reference not among approved lights
        }
      }

      ctx.clearRect(0, 0, W, H) // transparent — the CSS atmosphere shows behind

      // While a message panel is open, the whole field eases down to ~0.4.
      const fade = dimmedRef.current ? 0.4 : 1

      // Everything below draws in world coordinates through the camera.
      ctx.save()
      ctx.translate(W / 2, H / 2)
      ctx.scale(cam.s, cam.s)
      ctx.translate(-cam.fx, -cam.fy)

      // Dust
      for (const d of dust) {
        d.tw += reduce ? 0 : 0.01 * d.sp
        const a = (0.1 + Math.sin(d.tw) * 0.06) * fade
        ctx.beginPath()
        ctx.arc(d.x * W, d.y * H, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${palette.dustRgb},${a})`
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
        ctx.strokeStyle = `rgba(${palette.rippleRgb},${(1 - prog) * palette.rippleAlpha * fade})`
        ctx.lineWidth = 1 * dpr
        ctx.stroke()
      }

      // The source — warm white-gold, softly pulsing (dims a little as the field grows)
      const si = Math.max(0.3, 1 - stars.length * 0.03) * fade
      const pulse = reduce ? 1 : 1 + Math.sin(now / 900) * 0.12
      const sr = Math.max(0.01, sourceBaseR * pulse)
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, sr * 7)
      for (const [stop, rgb, alpha] of palette.source.glow) {
        grd.addColorStop(stop, `rgba(${rgb},${alpha * si})`)
      }
      ctx.beginPath()
      ctx.arc(cx, cy, sr * 7, 0, Math.PI * 2)
      ctx.fillStyle = grd
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx, cy, sr, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${palette.source.core.rgb},${palette.source.core.alpha * si})`
      ctx.fill()

      // Message lights: ease out from the source, then gently breathe.
      for (const s of stars) {
        if (now < s.born) continue
        const age = (now - s.born) / 1000
        const ease = Math.min(1, age / 1.4)
        const e = 1 - Math.pow(1 - ease, 3)
        s.x += (s.tx - s.x) * 0.06
        s.y += (s.ty - s.y) * 0.06
        // Breathing, not twinkling: slow pulse, gentle amplitude, soft phase
        // offset per light so they don't breathe in mechanical unison.
        s.tw += reduce ? 0 : 0.006 * s.sp
        const breath = reduce ? 1 : 0.82 + Math.sin(s.tw) * 0.18
        // Hovered points brighten and grow slightly; the focused point (personal
        // URL) holds a larger, sustained gold glow.
        const hover = s === hoveredRef.current ? 1.15 : 1
        const focused = focusActive && s === focusStar
        const r = Math.max(0.01, s.r * e * hover * (focused ? 1.6 : 1))
        const a = focused
          ? Math.min(1, (0.9 + Math.sin(now / 700) * 0.1) * e * fade)
          : breath * e * fade
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 6)
        for (const [stop, rgb, alpha] of palette.point.glow) {
          g.addColorStop(stop, `rgba(${rgb},${alpha * a})`)
        }
        ctx.beginPath()
        ctx.arc(s.x, s.y, r * 6, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
        ctx.beginPath()
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${palette.point.coreRgb},${a})`
        ctx.fill()
      }

      ctx.restore() // end camera transform

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
      canvas.removeEventListener('click', onClick)
    }
    // onSelect is read via closure; the field is built once and kept stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <div ref={atmosphereRef} className={styles.atmosphere} aria-hidden="true" />
      <canvas ref={canvasRef} className={styles.field} aria-hidden="true" />
      {tip && (
        <div
          ref={tipRef}
          className={styles.tooltip}
          style={{ left: tip.x, top: tip.y }}
          aria-hidden="true"
        >
          {tip.text}
        </div>
      )}
    </>
  )
}

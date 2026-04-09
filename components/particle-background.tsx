'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  baseVx: number
  baseVy: number
  r: number
  cr: number
  cg: number
  cb: number
  orbitDir: 1 | -1
}

const PALETTE: [number, number, number][] = [
  [255, 110, 120],
  [80, 170, 255],
  [60, 210, 170],
  [175, 110, 255],
  [255, 155, 65],
  [255, 90, 165],
  [55, 200, 225],
  [155, 215, 80],
  [255, 190, 80],
  [130, 100, 255],
]

const CURSOR_R = 160,
  CURSOR_G = 100,
  CURSOR_B = 255

// ── Loose orbital physics ────────────────────────────────────
const PARTICLE_COUNT = 110
const ATTRACT_DIST = 155 // outer attraction radius (px)
const ORBIT_R = 62 // target orbit radius (px)
const ORBIT_SPEED = 1.3 // target tangential speed (px/frame)
const RADIAL_K = 0.007 // weak spring — easy to escape
const TANGENTIAL_K = 0.035 // gentle tangential nudge
const RADIAL_DAMP = 0.07 // low damping — less "sticky"
const RETURN_K = 0.07 // fast drift recovery when mouse leaves
const MOUSE_EASE = 0.1 // trailing dot spring factor
// Mouse velocity scales down attraction — fast movement = easy detach
const VEL_SCALE_K = 0.1

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // exact-position cursor (replaces real pointer) — blue dot
  const exactCursorRef = useRef<HTMLDivElement>(null)
  // trailing decorative dot — follows with easing
  const trailCursorRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: -2000, y: -2000 })
  const prevMouseRef = useRef({ x: -2000, y: -2000 })
  const cursorPosRef = useRef({ x: -2000, y: -2000 })
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = window.innerWidth
    let H = window.innerHeight
    // Detect current colour scheme so line opacity can adapt
    const isDark = () => document.documentElement.classList.contains('dark')

    const resize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W
      canvas.height = H
    }
    resize()
    window.addEventListener('resize', resize)

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => {
      const [cr, cg, cb] = PALETTE[Math.floor(Math.random() * PALETTE.length)]
      const bvx = (Math.random() - 0.5) * 0.22
      const bvy = (Math.random() - 0.5) * 0.22
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: bvx,
        vy: bvy,
        baseVx: bvx,
        baseVy: bvy,
        r: Math.random() * 2.8 + 1.5,
        cr,
        cg,
        cb,
        orbitDir: Math.random() < 0.5 ? 1 : -1,
      }
    })

    const loop = () => {
      ctx.clearRect(0, 0, W, H)

      const { x: mx, y: my } = mouseRef.current
      const prev = prevMouseRef.current

      // Mouse speed this frame — used to weaken attraction when moving fast
      const mouseSpeed = Math.sqrt((mx - prev.x) ** 2 + (my - prev.y) ** 2)
      const attractScale = 1 / (1 + mouseSpeed * VEL_SCALE_K)
      prev.x = mx
      prev.y = my

      for (const p of particles) {
        const dx = mx - p.x
        const dy = my - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist > 0 && dist < ATTRACT_DIST) {
          const nx = dx / dist
          const ny = dy / dist
          const tx = -ny * p.orbitDir
          const ty = nx * p.orbitDir

          // Radial spring scaled by mouse velocity
          const radialDiff = dist - ORBIT_R
          p.vx += nx * radialDiff * RADIAL_K * attractScale
          p.vy += ny * radialDiff * RADIAL_K * attractScale

          // Radial damping (light)
          const radialV = p.vx * nx + p.vy * ny
          p.vx -= nx * radialV * RADIAL_DAMP
          p.vy -= ny * radialV * RADIAL_DAMP

          // Tangential push toward orbit speed
          const curTangentialV = p.vx * tx + p.vy * ty
          const tangentialErr = ORBIT_SPEED - curTangentialV
          p.vx += tx * tangentialErr * TANGENTIAL_K * attractScale
          p.vy += ty * tangentialErr * TANGENTIAL_K * attractScale
        } else {
          // Fast return to base drift
          p.vx += (p.baseVx - p.vx) * RETURN_K
          p.vy += (p.baseVy - p.vy) * RETURN_K
        }

        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H
        if (p.y > H) p.y = 0

        // Connection line — brighter in dark mode
        if (dist > 0 && dist < ATTRACT_DIST) {
          const t = 1 - dist / ATTRACT_DIST
          const dark = isDark()
          const lineA0 = dark ? t * 0.7 : t * 0.48
          const lineA1 = dark ? t * 0.5 : t * 0.32
          const mr = Math.round((CURSOR_R + p.cr) / 2)
          const mg = Math.round((CURSOR_G + p.cg) / 2)
          const mb = Math.round((CURSOR_B + p.cb) / 2)
          const ma = (lineA0 + lineA1) / 2
          ctx.beginPath()
          ctx.lineWidth = 0.6 + t * 0.9
          ctx.strokeStyle = `rgba(${mr},${mg},${mb},${ma})`
          ctx.moveTo(mx, my)
          ctx.lineTo(p.x, p.y)
          ctx.stroke()
        }

        // Soft halo — single translucent fill (blur comes from radius vs opacity)
        const haloR = p.r * 3.8
        ctx.beginPath()
        ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},0.14)`
        ctx.fill()

        // Sharp core
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},0.95)`
        ctx.fill()
      }

      // Trailing dot spring
      const cp = cursorPosRef.current
      cp.x += (mx - cp.x) * MOUSE_EASE
      cp.y += (my - cp.y) * MOUSE_EASE

      if (trailCursorRef.current) {
        trailCursorRef.current.style.left = `${cp.x}px`
        trailCursorRef.current.style.top = `${cp.y}px`
      }

      rafRef.current = requestAnimationFrame(loop)
    }
    loop()

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      // Exact cursor: update immediately (zero lag — this IS the pointer)
      if (exactCursorRef.current) {
        exactCursorRef.current.style.left = `${e.clientX}px`
        exactCursorRef.current.style.top = `${e.clientY}px`
      }
    }
    window.addEventListener('mousemove', onMove)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <>
      {/* ── Mega orbs — large blurred, nearly static depth ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="mega-orb mega-orb-1" aria-hidden="true" />
        <div className="mega-orb mega-orb-2" aria-hidden="true" />
        <div className="mega-orb mega-orb-3" aria-hidden="true" />
        {/* Smaller drifting orbs */}
        <div className="orb orb-pink" aria-hidden="true" />
        <div className="orb orb-blue" aria-hidden="true" />
        <div className="orb orb-green" aria-hidden="true" />
        <div className="orb orb-orange" aria-hidden="true" />
        <div className="orb orb-lavender" aria-hidden="true" />
      </div>

      {/* ── Particle + line canvas ───────────────────────── */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-1"
      />

      {/* ── Real cursor replacement — exact position, zero lag ── */}
      <div
        ref={exactCursorRef}
        aria-hidden="true"
        className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2"
        style={{ left: -200, top: -200 }}
      >
        <div
          style={{
            width: 11,
            height: 11,
            borderRadius: '50%',
            background: 'rgba(37,99,235,1)',
            boxShadow: '0 0 6px 2px rgba(37,99,235,0.55), 0 0 16px 5px rgba(37,99,235,0.2)',
          }}
        />
      </div>

      {/* ── Trailing decorative dot — lags behind with spring ── */}
      <div
        ref={trailCursorRef}
        aria-hidden="true"
        className="pointer-events-none fixed z-49 -translate-x-1/2 -translate-y-1/2"
        style={{ left: -200, top: -200 }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(160,100,255,0.7)',
            boxShadow: '0 0 8px 3px rgba(160,100,255,0.3)',
          }}
        />
      </div>
    </>
  )
}

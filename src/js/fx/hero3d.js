// Hero 3D light-dust layer — floating gold/teal bokeh particles with real
// depth (size attenuation) and mouse parallax, rendered above the hero video.
// No CSS filters / blend modes on the canvas: those froze the muted hero
// video in Chrome before (see main.css note) — all glow is done in WebGL.
import * as THREE from 'three'

export function initHero3D(canvas) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const hero = canvas.closest('.hero')
  if (!hero) return

  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: false, powerPreference: 'low-power',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60)
  camera.position.set(0, 0, 10)

  // --- particle cloud ---
  const mobile = window.innerWidth < 768
  const N = mobile ? 140 : 320
  const pos = new Float32Array(N * 3)
  const col = new Float32Array(N * 3)
  const seed = new Float32Array(N) // per-particle phase
  const speed = new Float32Array(N)

  const gold = new THREE.Color(0xe7c884)
  const teal = new THREE.Color(0x1aa6b0)
  const white = new THREE.Color(0xfff4d6)

  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 26
    pos[i * 3 + 1] = (Math.random() - 0.5) * 14
    pos[i * 3 + 2] = (Math.random() - 0.5) * 12
    const r = Math.random()
    const c = r < 0.62 ? gold : r < 0.82 ? teal : white
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
    seed[i] = Math.random() * Math.PI * 2
    speed[i] = 0.12 + Math.random() * 0.3
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))

  const mat = new THREE.PointsMaterial({
    size: 0.22, map: softSprite(), transparent: true, opacity: 0.75,
    vertexColors: true, depthWrite: false, blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })
  const points = new THREE.Points(geo, mat)
  scene.add(points)

  // --- mouse parallax (lerped) ---
  let mx = 0, my = 0, tx = 0, ty = 0
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('mousemove', (e) => {
      const b = hero.getBoundingClientRect()
      tx = ((e.clientX - b.left) / b.width - 0.5)
      ty = ((e.clientY - b.top) / b.height - 0.5)
    }, { passive: true })
  }

  // --- size ---
  function resize() {
    const w = hero.clientWidth, h = hero.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  // --- render loop, only while the hero is on screen ---
  let raf = 0, visible = true, t0 = performance.now()
  function frame(now) {
    raf = requestAnimationFrame(frame)
    const t = (now - t0) / 1000
    const p = geo.attributes.position.array
    for (let i = 0; i < N; i++) {
      p[i * 3 + 1] += speed[i] * 0.012
      if (p[i * 3 + 1] > 7.5) p[i * 3 + 1] = -7.5
      p[i * 3] += Math.sin(t * 0.5 + seed[i]) * 0.0035
    }
    geo.attributes.position.needsUpdate = true

    mx += (tx - mx) * 0.04
    my += (ty - my) * 0.04
    camera.position.x = mx * 1.6
    camera.position.y = -my * 1.1
    camera.lookAt(0, 0, 0)
    renderer.render(scene, camera)
  }

  function setRunning(on) {
    if (on && !raf) { t0 = performance.now() - 1; raf = requestAnimationFrame(frame) }
    if (!on && raf) { cancelAnimationFrame(raf); raf = 0 }
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; setRunning(visible && !document.hidden) })
    .observe(hero)
  document.addEventListener('visibilitychange', () => setRunning(visible && !document.hidden))
  setRunning(true)
}

/** soft round glow sprite drawn on a tiny canvas (no external asset) */
function softSprite() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

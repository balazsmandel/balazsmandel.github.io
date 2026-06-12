// Hero cinematic layer:
//  - journey story (SVG line art + GSAP MotionPath): a little drawn car rolls
//    up to the house, the passenger hops in, the car drives to the airport,
//    then a plane takes off and draws a glowing contrail across the sky
//  - depth dust: gold/teal bokeh particles in real 3D (WebGL)
//  - mouse tilt: the content stack leans toward the cursor, headline floats
//  - scroll exit: content recedes and fades, video slowly zooms
// No CSS filters / blend modes anywhere near the video — those froze the
// muted hero video in Chrome before (see main.css note). Glow is WebGL or
// plain layered strokes only.
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)

export function initHero3D(canvas) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const hero = canvas.closest('.hero')
  if (!hero) return
  const content = hero.querySelector('.hero-content')
  const video = hero.querySelector('.hero-bg-video')
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches

  initJourney(hero)

  // --- WebGL depth dust ---
  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: false, powerPreference: 'low-power',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60)
  camera.position.set(0, 0, 10)

  const mobile = window.innerWidth < 768
  const N = mobile ? 100 : 190
  const pos = new Float32Array(N * 3)
  const col = new Float32Array(N * 3)
  const seed = new Float32Array(N)
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
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.22, map: softSprite(), transparent: true, opacity: 0.55,
    vertexColors: true, depthWrite: false, blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })))

  // --- pointer + scroll state ---
  let tx = 0, ty = 0, mx = 0, my = 0, scrollP = 0
  if (fine) {
    hero.addEventListener('mousemove', (e) => {
      const b = hero.getBoundingClientRect()
      tx = (e.clientX - b.left) / b.width - 0.5
      ty = (e.clientY - b.top) / b.height - 0.5
    }, { passive: true })
    hero.addEventListener('mouseleave', () => { tx = 0; ty = 0 })
  }
  ScrollTrigger.create({
    trigger: hero, start: 'top top', end: 'bottom top', scrub: true,
    onUpdate: (self) => { scrollP = self.progress },
  })

  function resize() {
    const w = hero.clientWidth, h = hero.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

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

    mx += (tx - mx) * 0.05
    my += (ty - my) * 0.05
    camera.position.x = mx * 1.6
    camera.position.y = -my * 1.1
    camera.lookAt(0, 0, 0)
    renderer.render(scene, camera)

    // content: 3D lean toward the cursor + cinematic scroll exit
    if (content) {
      content.style.transform =
        `perspective(1100px) rotateY(${(mx * 3.5).toFixed(3)}deg) rotateX(${(-my * 2.5).toFixed(3)}deg)` +
        ` translateY(${(-scrollP * 130).toFixed(1)}px)`
      content.style.opacity = String(Math.max(0, 1 - scrollP * 1.25))
    }
    if (video) video.style.transform = `scale(${(1 + scrollP * 0.14).toFixed(4)})`
  }
  function setRunning(on) {
    if (on && !raf) { raf = requestAnimationFrame(frame) }
    if (!on && raf) { cancelAnimationFrame(raf); raf = 0 }
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; setRunning(visible && !document.hidden) })
    .observe(hero)
  document.addEventListener('visibilitychange', () => setRunning(visible && !document.hidden))
  setRunning(true)
}

/** the journey story: house → car picks the passenger up → airport → takeoff */
function initJourney(hero) {
  const svg = hero.querySelector('.hero-journey')
  if (!svg) return
  const road = svg.querySelector('.hj-road')
  const sky = svg.querySelector('.hj-sky')
  const trail = svg.querySelector('.hj-trail')
  const glow = svg.querySelector('.hj-trailglow')
  const car = svg.querySelector('.hj-car')
  const pax = svg.querySelector('.hj-pax')
  const plane = svg.querySelector('.hj-plane')
  if (!road || !sky || !trail || !car || !plane) return

  const L = sky.getTotalLength()
  const SEG = 220
  ;[trail, glow].forEach((el) => el && el.setAttribute('stroke-dasharray', `${SEG} ${L + SEG}`))

  const carPath = { path: road, align: road, alignOrigin: [0.5, 0.82], autoRotate: true }

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.4, delay: 1.0 })
  // reset + park the car at the house
  tl.set(car, { motionPath: { ...carPath, start: 0, end: 0.0001 }, opacity: 0 }, 0)
  tl.set([trail, glow, plane].filter(Boolean), { opacity: 0 }, 0)
  tl.set(pax, { opacity: 0, x: 0 }, 0)
  // car appears, passenger walks over and hops in
  tl.to(car, { opacity: 1, duration: 0.5 }, 0.2)
  tl.to(pax, { opacity: 1, duration: 0.3 }, 0.4)
  tl.to(pax, { x: 26, duration: 0.9, ease: 'power1.inOut' }, 0.8)
  tl.to(pax, { opacity: 0, duration: 0.25 }, 1.6)
  // drive to the airport
  tl.to(car, { motionPath: carPath, duration: 4.4, ease: 'power1.inOut' }, 2.0)
  tl.to(car, { opacity: 0, duration: 0.5 }, 6.7)
  // takeoff: contrail draws across the sky
  tl.set([trail, glow, plane].filter(Boolean), { opacity: 1 }, 7.0)
  tl.fromTo([trail, glow].filter(Boolean),
    { strokeDashoffset: SEG },
    { strokeDashoffset: SEG - L, duration: 6.4, ease: 'none' }, 7.0)
  tl.to(plane, {
    motionPath: { path: sky, align: sky, alignOrigin: [0.5, 0.5], autoRotate: true },
    duration: 6.4, ease: 'none',
  }, 7.0)
  tl.to([trail, glow, plane].filter(Boolean), { opacity: 0, duration: 0.9 }, 12.6)

  new IntersectionObserver(([e]) => { e.isIntersecting ? tl.play() : tl.pause() }).observe(hero)
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

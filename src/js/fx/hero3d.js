// Hero cinematic layer (no WebGL — the showroom look is CSS + SVG + GSAP):
//  - journey story (SVG line art + GSAP MotionPath): a little drawn car rolls
//    up to the house, the passenger hops in, the car drives along the bottom
//    of the hero to the airport, then a plane takes off with a glowing
//    contrail across the sky
//  - mouse tilt: the content stack leans toward the cursor, the headline
//    floats above it (preserve-3d); the S-Class drifts the other way (depth)
//  - scroll exit: content recedes and fades, the car sinks slightly
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)

export function initHeroFX(hero) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const content = hero.querySelector('.hero-content')
  const car = hero.querySelector('.hero-car')
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches

  initJourney(hero)
  initNightDrive(hero)

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

  let raf = 0, visible = true
  function frame() {
    raf = requestAnimationFrame(frame)
    mx += (tx - mx) * 0.05
    my += (ty - my) * 0.05
    if (content) {
      content.style.transform =
        `perspective(1100px) rotateY(${(mx * 3.5).toFixed(3)}deg) rotateX(${(-my * 2.5).toFixed(3)}deg)` +
        ` translateY(${(-scrollP * 130).toFixed(1)}px)`
      content.style.opacity = String(Math.max(0, 1 - scrollP * 1.25))
    }
    if (car) {
      // opposite, slower drift than the content = parallax depth
      car.style.transform =
        `translate(${(-mx * 16).toFixed(1)}px, ${(-my * 9 + scrollP * 70).toFixed(1)}px)`
    }
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

/** "night drive": long-exposure light trails streaming past the parked
 *  S-Class (the car faces left, so the world rushes right) + city bokeh.
 *  Plain 2D canvas with additive compositing — cheap, full control. */
function initNightDrive(hero) {
  const canvas = hero.querySelector('.hero-drive')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const DPR = Math.min(window.devicePixelRatio, 1.5)
  let W = 0, H = 0

  // static night skyline (buildings + lit windows + airport tower), drawn
  // once into an offscreen canvas and blitted under the streaks every frame
  let skyline = null
  function drawSkyline() {
    skyline = document.createElement('canvas')
    skyline.width = W * DPR
    skyline.height = H * DPR
    const sc = skyline.getContext('2d')
    sc.setTransform(DPR, 0, 0, DPR, 0, 0)
    const horizon = H * 0.625
    let x = -20
    let i = 0
    while (x < W) {
      // pseudo-random but stable-ish building strip
      const bw = 26 + ((i * 7919) % 70)
      const bh = 30 + ((i * 104729) % 110)
      const top = horizon - bh
      sc.fillStyle = 'rgba(16,23,32,.9)'
      sc.fillRect(x, top, bw, bh)
      // lit windows
      sc.fillStyle = 'rgba(231,200,132,.5)'
      for (let wy = top + 7; wy < horizon - 6; wy += 11) {
        for (let wx = x + 5; wx < x + bw - 5; wx += 10) {
          if (((wx * 31 + wy * 17 + i * 13) | 0) % 7 < 2) sc.fillRect(wx, wy, 2.4, 3.6)
        }
      }
      x += bw + 4 + ((i * 31) % 26)
      i++
    }
    // airport control tower, left of the car
    const tx = W * 0.30, th = H * 0.165
    sc.fillStyle = 'rgba(20,28,38,.95)'
    sc.fillRect(tx - 4, horizon - th, 8, th)
    sc.beginPath()
    sc.ellipse(tx, horizon - th, 17, 9, 0, 0, Math.PI * 2)
    sc.fill()
    sc.fillStyle = 'rgba(231,200,132,.65)'
    sc.fillRect(tx - 13, horizon - th - 2.5, 26, 3)
    // haze above the rooftops
    const hz = sc.createLinearGradient(0, horizon - H * 0.2, 0, horizon)
    hz.addColorStop(0, 'rgba(24,42,60,0)')
    hz.addColorStop(1, 'rgba(24,42,60,.35)')
    sc.fillStyle = hz
    sc.fillRect(0, horizon - H * 0.2, W, H * 0.2)
  }

  function resize() {
    W = hero.clientWidth
    H = hero.clientHeight
    canvas.width = W * DPR
    canvas.height = H * DPR
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    drawSkyline()
  }
  resize()
  window.addEventListener('resize', resize)

  // colour palette: mostly warm headlight gold/white, hints of teal + red
  const COLORS = [
    [255, 220, 150], [255, 244, 214], [255, 255, 255],
    [255, 220, 150], [255, 244, 214],
    [120, 220, 230], [255, 120, 100],
  ]
  const pick = (a) => a[(Math.random() * a.length) | 0]

  // depth layers: far = slow/dim/thin city, near = fast bright road-level
  const LAYERS = [
    { n: 16, v: [40, 90], a: [0.1, 0.2], th: [1, 1.5], len: [70, 190], y: [0.3, 0.58] },
    { n: 22, v: [160, 280], a: [0.18, 0.34], th: [1.5, 2.4], len: [150, 380], y: [0.44, 0.78] },
    { n: 14, v: [400, 680], a: [0.26, 0.46], th: [2.4, 3.8], len: [260, 580], y: [0.62, 0.94] },
  ]
  const rnd = ([lo, hi]) => lo + Math.random() * (hi - lo)
  const streaks = []
  for (const L of LAYERS) {
    for (let i = 0; i < L.n; i++) {
      streaks.push({
        x: Math.random() * 1.6 - 0.3, // in widths, can start off screen
        y: rnd(L.y), v: rnd(L.v), a: rnd(L.a), th: rnd(L.th), len: rnd(L.len),
        c: pick(COLORS),
      })
    }
  }
  // slow drifting city bokeh
  const bokeh = Array.from({ length: 16 }, () => ({
    x: Math.random(), y: 0.15 + Math.random() * 0.5,
    r: 26 + Math.random() * 70, v: 6 + Math.random() * 16,
    a: 0.025 + Math.random() * 0.05, c: pick(COLORS),
  }))

  let raf = 0, visible = true, last = 0
  function frame(now) {
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016)
    last = now
    ctx.clearRect(0, 0, W, H)
    ctx.globalCompositeOperation = 'source-over'
    if (skyline) ctx.drawImage(skyline, 0, 0, W, H)
    ctx.globalCompositeOperation = 'lighter'

    for (const b of bokeh) {
      b.x += (b.v * dt) / W
      if (b.x > 1.1) b.x = -0.1
      const g = ctx.createRadialGradient(b.x * W, b.y * H, 0, b.x * W, b.y * H, b.r)
      g.addColorStop(0, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},${b.a})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(b.x * W - b.r, b.y * H - b.r, b.r * 2, b.r * 2)
    }

    for (const s of streaks) {
      s.x += (s.v * dt) / W
      if (s.x * W > W + s.len) { s.x = -(s.len + Math.random() * 400) / W; s.y = s.y }
      const x = s.x * W, y = s.y * H
      const [r, g2, b2] = s.c
      const grad = ctx.createLinearGradient(x - s.len, 0, x, 0)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(0.55, `rgba(${r},${g2},${b2},${s.a * 0.55})`)
      grad.addColorStop(0.96, `rgba(255,255,255,${s.a})`)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      // soft outer pass + bright core = cheap glow without filters
      ctx.globalAlpha = 0.45
      ctx.fillRect(x - s.len, y - s.th * 1.6, s.len, s.th * 3.2)
      ctx.globalAlpha = 1
      ctx.fillRect(x - s.len, y - s.th / 2, s.len, s.th)
    }
  }
  function setRunning(on) {
    if (on && !raf) { last = 0; raf = requestAnimationFrame(frame) }
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
  // drive to the airport (longer road now — across the whole hero)
  tl.to(car, { motionPath: carPath, duration: 5.6, ease: 'power1.inOut' }, 2.0)
  tl.to(car, { opacity: 0, duration: 0.5 }, 7.9)
  // takeoff: contrail draws across the sky
  tl.set([trail, glow, plane].filter(Boolean), { opacity: 1 }, 8.2)
  tl.fromTo([trail, glow].filter(Boolean),
    { strokeDashoffset: SEG },
    { strokeDashoffset: SEG - L, duration: 6.4, ease: 'none' }, 8.2)
  tl.to(plane, {
    motionPath: { path: sky, align: sky, alignOrigin: [0.5, 0.5], autoRotate: true },
    duration: 6.4, ease: 'none',
  }, 8.2)
  tl.to([trail, glow, plane].filter(Boolean), { opacity: 0, duration: 0.9 }, 13.8)

  new IntersectionObserver(([e]) => { e.isIntersecting ? tl.play() : tl.pause() }).observe(hero)
}

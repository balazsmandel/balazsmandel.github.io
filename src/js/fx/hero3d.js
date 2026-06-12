// Hero "kinetic type" layer — the headline letterforms are windows into a
// speeding night world: light trails, city skyline and bokeh blaze INSIDE
// the giant letters at full brightness while the scene outside stays dim.
// The cursor is a headlight that ignites the letters where it points.
// Plus the journey story (little drawn car → airport → takeoff) at the
// bottom, and content tilt / scroll exit. No WebGL, no video, no assets —
// everything is drawn in 2D canvas + SVG.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)

export function initHeroFX(hero) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  hero.classList.add('fx-on') // makes the DOM headline transparent (canvas paints it)

  initJourney(hero)
  initKineticType(hero)

  // --- optional foreground car (shows up once the asset exists) ---
  const car2 = hero.querySelector('.hero-car2')
  if (car2) {
    const img = car2.querySelector('.hc2-img')
    const show = () => { if (img.naturalWidth > 0) car2.hidden = false }
    img.complete ? show() : img.addEventListener('load', show)
  }

  // --- content tilt + scroll exit ---
  const content = hero.querySelector('.hero-content')
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
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
        `perspective(1100px) rotateY(${(mx * 2.5).toFixed(3)}deg) rotateX(${(-my * 1.8).toFixed(3)}deg)` +
        ` translateY(${(-scrollP * 130).toFixed(1)}px)`
      content.style.opacity = String(Math.max(0, 1 - scrollP * 1.25))
    }
    if (car2 && !car2.hidden) {
      // drifts against the content = depth, sinks a touch on scroll
      car2.style.transform =
        `translate(${(-mx * 18).toFixed(1)}px, ${(-my * 10 + scrollP * 60).toFixed(1)}px)`
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

/* ====================== kinetic type ====================== */

function initKineticType(hero) {
  const canvas = hero.querySelector('.hero-drive')
  const h1 = hero.querySelector('h1')
  if (!canvas || !h1) return
  const ctx = canvas.getContext('2d')
  const DPR = Math.min(window.devicePixelRatio, 1.5)
  let W = 0, H = 0

  // offscreen buffers: full bright scene / text mask / text outline / composite
  const sceneC = document.createElement('canvas'); const sctx = sceneC.getContext('2d')
  const maskC = document.createElement('canvas'); const mctx = maskC.getContext('2d')
  const strokeC = document.createElement('canvas'); const kctx = strokeC.getContext('2d')
  const maskedC = document.createElement('canvas'); const xctx = maskedC.getContext('2d')
  let skylineC = null

  /* ---------- the night scene (drawn bright, masked by the type) ---------- */
  const COLORS = [
    [255, 220, 150], [255, 244, 214], [255, 255, 255],
    [255, 220, 150], [255, 244, 214],
    [120, 220, 230], [255, 120, 100],
  ]
  const pick = (a) => a[(Math.random() * a.length) | 0]
  const rnd = ([lo, hi]) => lo + Math.random() * (hi - lo)
  const LAYERS = [
    { n: 16, v: [50, 110], a: [0.22, 0.4], th: [1, 1.6], len: [80, 200], y: [0.05, 0.95] },
    { n: 22, v: [180, 320], a: [0.35, 0.6], th: [1.6, 2.6], len: [160, 420], y: [0.05, 0.95] },
    { n: 14, v: [430, 720], a: [0.5, 0.85], th: [2.6, 4.2], len: [280, 620], y: [0.05, 0.95] },
  ]
  const streaks = []
  for (const L of LAYERS) for (let i = 0; i < L.n; i++) {
    streaks.push({ x: Math.random() * 1.6 - 0.3, y: rnd(L.y), v: rnd(L.v), a: rnd(L.a), th: rnd(L.th), len: rnd(L.len), c: pick(COLORS) })
  }
  const bokeh = Array.from({ length: 14 }, () => ({
    x: Math.random(), y: Math.random(), r: 30 + Math.random() * 80,
    v: 8 + Math.random() * 18, a: 0.05 + Math.random() * 0.08, c: pick(COLORS),
  }))

  function drawSkyline() {
    skylineC = document.createElement('canvas')
    skylineC.width = W * DPR; skylineC.height = H * DPR
    const sc = skylineC.getContext('2d')
    sc.setTransform(DPR, 0, 0, DPR, 0, 0)
    const horizon = H * 0.8
    let x = -20, i = 0
    while (x < W) {
      const bw = 26 + ((i * 7919) % 70)
      const bh = 40 + ((i * 104729) % 150)
      const top = horizon - bh
      sc.fillStyle = 'rgba(34,48,64,.95)'
      sc.fillRect(x, top, bw, bh)
      sc.fillStyle = 'rgba(231,200,132,.75)'
      for (let wy = top + 7; wy < horizon - 6; wy += 11) {
        for (let wx = x + 5; wx < x + bw - 5; wx += 10) {
          if (((wx * 31 + wy * 17 + i * 13) | 0) % 7 < 2) sc.fillRect(wx, wy, 2.4, 3.6)
        }
      }
      x += bw + 4 + ((i * 31) % 26)
      i++
    }
    const hz = sc.createLinearGradient(0, horizon - H * 0.25, 0, horizon)
    hz.addColorStop(0, 'rgba(36,62,88,0)')
    hz.addColorStop(1, 'rgba(36,62,88,.5)')
    sc.fillStyle = hz
    sc.fillRect(0, horizon - H * 0.25, W, H * 0.25)
  }

  /** the cursor headlight (auto-roves on touch devices) */
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  let lx = 0.5, ly = 0.45, ltx = 0.5, lty = 0.45
  if (fine) {
    hero.addEventListener('mousemove', (e) => {
      const b = hero.getBoundingClientRect()
      ltx = (e.clientX - b.left) / b.width
      lty = (e.clientY - b.top) / b.height
    }, { passive: true })
  }

  // optional generated backdrop: drop a cinematic night shot into
  // public/assets/img/hero-letters.jpg and it becomes the in-letter texture
  const photo = new Image()
  let photoOk = false
  photo.onload = () => { photoOk = true }
  photo.onerror = () => { photoOk = false }
  photo.src = '/assets/img/hero-letters.jpg'

  function drawScene(t, dt) {
    sctx.clearRect(0, 0, W, H)
    if (photoOk) {
      // cover-fit the generated night shot
      const s = Math.max(W / photo.naturalWidth, H / photo.naturalHeight)
      const pw = photo.naturalWidth * s, ph = photo.naturalHeight * s
      sctx.drawImage(photo, (W - pw) / 2, (H - ph) / 2, pw, ph)
    } else {
      // procedural fallback: warm wash + drawn skyline
      const base = sctx.createLinearGradient(0, 0, 0, H)
      base.addColorStop(0, 'rgba(64,92,126,.65)')
      base.addColorStop(0.55, 'rgba(118,98,58,.6)')
      base.addColorStop(1, 'rgba(231,200,132,.45)')
      sctx.fillStyle = base
      sctx.fillRect(0, 0, W, H)
      if (skylineC) sctx.drawImage(skylineC, 0, 0, W, H)
    }

    sctx.globalCompositeOperation = 'lighter'
    // constant lift so the letters are ALWAYS vivid (the headlight only adds)
    const lift = sctx.createLinearGradient(0, 0, 0, H)
    lift.addColorStop(0, 'rgba(90,120,160,.12)')
    lift.addColorStop(0.6, 'rgba(231,200,132,.16)')
    lift.addColorStop(1, 'rgba(231,200,132,.24)')
    sctx.fillStyle = lift
    sctx.fillRect(0, 0, W, H)
    const cg = sctx.createRadialGradient(W * 0.5, H * 0.46, 0, W * 0.5, H * 0.46, W * 0.5)
    cg.addColorStop(0, 'rgba(255,244,214,.18)')
    cg.addColorStop(1, 'rgba(0,0,0,0)')
    sctx.fillStyle = cg
    sctx.fillRect(0, 0, W, H)
    for (const b of bokeh) {
      b.x += (b.v * dt) / W
      if (b.x > 1.1) b.x = -0.1
      const g = sctx.createRadialGradient(b.x * W, b.y * H, 0, b.x * W, b.y * H, b.r)
      g.addColorStop(0, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},${b.a})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      sctx.fillStyle = g
      sctx.fillRect(b.x * W - b.r, b.y * H - b.r, b.r * 2, b.r * 2)
    }
    for (const s of streaks) {
      s.x += (s.v * dt) / W
      if (s.x * W > W + s.len) s.x = -(s.len + Math.random() * 400) / W
      const x = s.x * W, y = s.y * H
      const [r, g2, b2] = s.c
      const grad = sctx.createLinearGradient(x - s.len, 0, x, 0)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(0.55, `rgba(${r},${g2},${b2},${s.a * 0.55})`)
      grad.addColorStop(0.96, `rgba(255,255,255,${s.a})`)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      sctx.fillStyle = grad
      sctx.globalAlpha = 0.45
      sctx.fillRect(x - s.len, y - s.th * 1.6, s.len, s.th * 3.2)
      sctx.globalAlpha = 1
      sctx.fillRect(x - s.len, y - s.th / 2, s.len, s.th)
    }
    // headlight: ignites the letters where the cursor points
    if (!fine) { ltx = 0.5 + Math.sin(t * 0.45) * 0.32; lty = 0.42 + Math.cos(t * 0.33) * 0.16 }
    lx += (ltx - lx) * 0.07
    ly += (lty - ly) * 0.07
    const R = Math.max(W, H) * 0.24
    const hl = sctx.createRadialGradient(lx * W, ly * H, 0, lx * W, ly * H, R)
    hl.addColorStop(0, 'rgba(255,244,214,.3)')
    hl.addColorStop(0.5, 'rgba(231,200,132,.12)')
    hl.addColorStop(1, 'rgba(0,0,0,0)')
    sctx.fillStyle = hl
    sctx.fillRect(lx * W - R, ly * H - R, R * 2, R * 2)
    sctx.globalCompositeOperation = 'source-over'
  }

  /* ---------- the type mask, measured from the real DOM headline ---------- */
  function buildText() {
    for (const [c, cc] of [[maskC, mctx], [strokeC, kctx]]) {
      c.width = W * DPR; c.height = H * DPR
      cc.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    const hr = hero.getBoundingClientRect()
    h1.querySelectorAll('.ln > span').forEach((span) => {
      const r = span.getBoundingClientRect()
      const cs = getComputedStyle(span)
      const txt = span.textContent.toUpperCase()
      const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      for (const cc of [mctx, kctx]) {
        cc.font = font
        if ('letterSpacing' in cc) cc.letterSpacing = cs.letterSpacing
        cc.textBaseline = 'top'
      }
      const x = r.left - hr.left
      const y = r.top - hr.top
      mctx.fillStyle = '#fff'
      mctx.fillText(txt, x, y)
      kctx.strokeStyle = 'rgba(231,200,132,.7)'
      kctx.lineWidth = 1.4
      kctx.strokeText(txt, x, y)
    })
  }

  function resize() {
    W = hero.clientWidth
    H = hero.clientHeight
    for (const c of [canvas, sceneC, maskedC]) { c.width = W * DPR; c.height = H * DPR }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    sctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    drawSkyline()
    buildText()
  }
  resize()
  window.addEventListener('resize', resize)
  // re-measure once webfonts arrive, and whenever the language switches
  if (document.fonts?.ready) document.fonts.ready.then(buildText)
  new MutationObserver(() => buildText()).observe(h1, { childList: true, subtree: true, characterData: true })

  /* ---------- composite ---------- */
  const intro = { p: 0 }
  gsap.to(intro, { p: 1, duration: 1.4, ease: 'power3.out', delay: 0.25 })

  let raf = 0, visible = true, last = 0, t0 = performance.now()
  function frame(now) {
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016)
    last = now
    const t = (now - t0) / 1000
    drawScene(t, dt)

    // bright scene clipped to the letterforms
    xctx.setTransform(1, 0, 0, 1, 0, 0)
    xctx.clearRect(0, 0, maskedC.width, maskedC.height)
    xctx.globalCompositeOperation = 'source-over'
    xctx.drawImage(sceneC, 0, 0)
    xctx.globalCompositeOperation = 'destination-in'
    xctx.drawImage(maskC, 0, 0)

    ctx.clearRect(0, 0, W, H)
    // the world outside the letters: barely-there atmosphere
    ctx.globalAlpha = 0.13
    ctx.drawImage(sceneC, 0, 0, W, H)
    // the letters: window into the bright night (with intro rise + fade)
    ctx.globalAlpha = intro.p
    const rise = (1 - intro.p) * H * 0.05
    ctx.drawImage(maskedC, 0, rise, W, H)
    ctx.globalAlpha = 0.85 * intro.p
    ctx.drawImage(strokeC, 0, rise, W, H)
    ctx.globalAlpha = 1
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

/* ====================== journey story ====================== */

/** house → car picks the passenger up → airport → takeoff.
 *  Rebuilds itself whenever the phone/desktop breakpoint flips, so toggling
 *  device emulation or rotating the phone never strands the desktop layout. */
function initJourney(hero) {
  const svg = hero.querySelector('.hero-journey')
  if (!svg) return
  const q = (s) => svg.querySelector(s)
  const road = q('.hj-road'), sky = q('.hj-sky'), trail = q('.hj-trail'), glow = q('.hj-trailglow')
  const car = q('.hj-car'), pax = q('.hj-pax'), plane = q('.hj-plane')
  const house = q('.hj-house'), airport = q('.hj-airport')
  if (!road || !sky || !trail || !car || !plane) return

  // desktop geometry comes from the markup; phones get a portrait layout
  const DESKTOP = {
    viewBox: svg.getAttribute('viewBox'),
    road: road.getAttribute('d'),
    sky: sky.getAttribute('d'),
    house: house?.getAttribute('transform'),
    airport: airport?.getAttribute('transform'),
    pax: [pax?.getAttribute('cx'), pax?.getAttribute('cy')],
    carScale: 1,
  }
  const PHONE = {
    viewBox: '0 0 412 915',
    road: 'M 30 700 C 90 712, 140 682, 200 664 S 330 642, 370 636',
    sky: 'M 380 622 C 400 530, 360 434, 280 376 S 130 288, 70 208 S 36 148, 20 116',
    house: 'translate(26,674) scale(.85)',
    airport: 'translate(386,620) scale(.85)',
    pax: ['32', '692'],
    carScale: 0.8,
  }
  const mq = window.matchMedia('(max-width: 760px)')
  let tl = null

  function build() {
    tl?.kill()
    const C = mq.matches ? PHONE : DESKTOP
    svg.setAttribute('viewBox', C.viewBox)
    road.setAttribute('d', C.road)
    ;[sky, trail, glow].forEach((p) => p && p.setAttribute('d', C.sky))
    if (house && C.house) house.setAttribute('transform', C.house)
    if (airport && C.airport) airport.setAttribute('transform', C.airport)
    if (pax) { pax.setAttribute('cx', C.pax[0]); pax.setAttribute('cy', C.pax[1]) }
    gsap.set(car, { scale: C.carScale, transformOrigin: '50% 50%' }) // survives motionPath

    const L = sky.getTotalLength()
    const SEG = 220
    ;[trail, glow].forEach((el) => el && el.setAttribute('stroke-dasharray', `${SEG} ${L + SEG}`))

    const carPath = { path: road, align: road, alignOrigin: [0.5, 0.82], autoRotate: true }

    tl = gsap.timeline({ repeat: -1, repeatDelay: 2.4, delay: 1.0 })
    tl.set(car, { motionPath: { ...carPath, start: 0, end: 0.0001 }, opacity: 0 }, 0)
    tl.set([trail, glow, plane].filter(Boolean), { opacity: 0 }, 0)
    tl.set(pax, { opacity: 0, x: 0 }, 0)
    tl.to(car, { opacity: 1, duration: 0.5 }, 0.2)
    tl.to(pax, { opacity: 1, duration: 0.3 }, 0.4)
    tl.to(pax, { x: 26, duration: 0.9, ease: 'power1.inOut' }, 0.8)
    tl.to(pax, { opacity: 0, duration: 0.25 }, 1.6)
    tl.to(car, { motionPath: carPath, duration: 5.6, ease: 'power1.inOut' }, 2.0)
    tl.to(car, { opacity: 0, duration: 0.5 }, 7.9)
    tl.set([trail, glow, plane].filter(Boolean), { opacity: 1 }, 8.2)
    tl.fromTo([trail, glow].filter(Boolean),
      { strokeDashoffset: SEG },
      { strokeDashoffset: SEG - L, duration: 6.4, ease: 'none' }, 8.2)
    tl.to(plane, {
      motionPath: { path: sky, align: sky, alignOrigin: [0.5, 0.5], autoRotate: true },
      duration: 6.4, ease: 'none',
    }, 8.2)
    tl.to([trail, glow, plane].filter(Boolean), { opacity: 0, duration: 0.9 }, 13.8)
  }
  build()
  mq.addEventListener('change', build)

  new IntersectionObserver(([e]) => { if (tl) { e.isIntersecting ? tl.play() : tl.pause() } }).observe(hero)
}

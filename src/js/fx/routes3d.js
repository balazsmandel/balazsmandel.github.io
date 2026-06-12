// 3D night route map — Tatabánya → Budapest (BUD) / Bécs (VIE) glowing arcs
// over a dark grid plane, with light pulses travelling along each route.
// Scroll dollies the camera in; hovering a price card highlights its route.
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import MAP from './map-bounds.json'

gsap.registerPlugin(ScrollTrigger)

const GOLD = 0xe7c884
const TEAL = 0x35c6d0
const INK = 0x07090c

// ground plane sized to the baked night-map (web mercator, see bake-map.mjs)
const MAP_W = 15
const MAP_H = MAP_W * (MAP.px.h / MAP.px.w)
const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
/** real lon/lat → scene coords on the map plane */
function project(lon, lat) {
  const u = (lon - MAP.lonW) / (MAP.lonE - MAP.lonW)
  const v = (mercY(MAP.latN) - mercY(lat)) / (mercY(MAP.latN) - mercY(MAP.latS))
  return new THREE.Vector3((u - 0.5) * MAP_W, 0, (v - 0.5) * MAP_H)
}

// real geographic positions
const CITIES = {
  origin: project(18.4048, 47.5692), // Tatabánya
  bud: project(19.2611, 47.4369),    // Budapest Liszt Ferenc
  vie: project(16.5697, 48.1103),    // Wien Schwechat
  bts: project(17.2127, 48.1702),    // Bratislava
}

export function initRoutes3D(root) {
  const canvas = root.querySelector('canvas')
  if (!canvas) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(INK, 10, 20)

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80)

  // --- ground: real night map of the region (baked from CARTO dark tiles),
  // with a faint grid that doubles as fallback while/if the texture loads ---
  const grid = new THREE.GridHelper(46, 46, 0x1b2733, 0x121a22)
  grid.material.transparent = true
  grid.material.opacity = 0.55
  scene.add(grid)

  const mapMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  // CARTO dark tiles are nearly black — multiply up the exposure, cool tint
  mapMat.color.setRGB(2.5, 2.7, 2.9)
  const mapMesh = new THREE.Mesh(new THREE.PlaneGeometry(MAP_W, MAP_H), mapMat)
  mapMesh.rotation.x = -Math.PI / 2
  mapMesh.position.y = -0.012
  mapMesh.renderOrder = -1
  scene.add(mapMesh)
  new THREE.TextureLoader().load('/assets/img/map-night.png', (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
    mapMat.map = tex
    mapMat.needsUpdate = true
    gsap.to(mapMat, { opacity: 0.95, duration: 1.2, ease: 'power1.out' })
    gsap.to(grid.material, { opacity: 0.1, duration: 1.2 })
  })

  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 48),
    new THREE.MeshBasicMaterial({ map: radialTex('rgba(231,200,132,.20)'), transparent: true, depthWrite: false })
  )
  pool.rotation.x = -Math.PI / 2
  pool.position.copy(CITIES.origin).setY(0.01)
  scene.add(pool)

  // --- faint stars above the horizon ---
  scene.add(makeStars())

  // --- cities: dot + flat ring ---
  const markers = {}
  const cityColor = { origin: GOLD, bud: GOLD, vie: TEAL, bts: 0xd9e2ec }
  for (const [key, v] of Object.entries(CITIES)) {
    markers[key] = makeCity(v, cityColor[key] ?? TEAL)
    scene.add(markers[key].group)
  }
  // radar pulse rings expanding from the origin ("anywhere")
  const radar = makeRadar(CITIES.origin)
  scene.add(radar.group)

  // --- routes: arc tube + travelling light pulses ---
  const routes = {
    bud: makeRoute(CITIES.origin, CITIES.bud, 0.6, GOLD),
    vie: makeRoute(CITIES.origin, CITIES.vie, 1.05, TEAL),
    bts: makeRoute(CITIES.origin, CITIES.bts, 0.85, 0xd9e2ec),
  }
  Object.values(routes).forEach((r) => scene.add(r.group))

  // --- DOM labels projected onto the scene each frame ---
  const labels = {}
  root.querySelectorAll('.r3d-label').forEach((el) => { labels[el.dataset.city] = el })
  const v3 = new THREE.Vector3()
  function placeLabels() {
    const w = root.clientWidth, h = root.clientHeight
    for (const [key, el] of Object.entries(labels)) {
      if (!CITIES[key]) continue
      v3.copy(CITIES[key]); v3.y += 0.22
      v3.project(camera)
      el.style.left = ((v3.x * 0.5 + 0.5) * w) + 'px'
      el.style.top = ((-v3.y * 0.5 + 0.5) * h) + 'px'
      el.style.opacity = v3.z < 1 ? 1 : 0
    }
  }

  // --- camera: scroll dolly + mouse parallax ---
  const pose = { dolly: reduced ? 1 : 0, mx: 0, my: 0 }
  let tx = 0, ty = 0
  const FROM = { pos: new THREE.Vector3(-0.6, 6.0, 9.2), look: new THREE.Vector3(-0.6, 0, -0.5) }
  const TO = { pos: new THREE.Vector3(-0.6, 3.2, 5.5), look: new THREE.Vector3(-0.6, 0.3, -0.4) }
  function applyCamera() {
    const d = pose.dolly
    camera.position.lerpVectors(FROM.pos, TO.pos, d)
    camera.position.x += pose.mx * 1.4
    camera.position.y += -pose.my * 0.8
    const look = new THREE.Vector3().lerpVectors(FROM.look, TO.look, d)
    camera.lookAt(look)
  }

  if (!reduced) {
    gsap.to(pose, {
      dolly: 1, ease: 'none',
      scrollTrigger: { trigger: root, start: 'top 92%', end: 'center 48%', scrub: 0.6 },
    })
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      root.addEventListener('mousemove', (e) => {
        const b = root.getBoundingClientRect()
        tx = (e.clientX - b.left) / b.width - 0.5
        ty = (e.clientY - b.top) / b.height - 0.5
      }, { passive: true })
      root.addEventListener('mouseleave', () => { tx = 0; ty = 0 })
    }
  }

  // --- price-card hover → highlight matching route ---
  const state = { focus: null } // 'bud' | 'vie' | 'any' | null
  document.querySelectorAll('[data-route]').forEach((card) => {
    card.addEventListener('mouseenter', () => { state.focus = card.dataset.route })
    card.addEventListener('mouseleave', () => { state.focus = null })
  })

  // --- size ---
  function resize() {
    const w = root.clientWidth, h = root.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  // --- render loop ---
  let raf = 0, visible = true, t0 = performance.now()
  function frame(now) {
    raf = requestAnimationFrame(frame)
    const t = (now - t0) / 1000

    pose.mx += (tx - pose.mx) * 0.05
    pose.my += (ty - pose.my) * 0.05
    applyCamera()

    // city ring pulse
    for (const m of Object.values(markers)) m.tick(t)
    radar.tick(t, state.focus === 'any')

    // routes: pulses travel, highlight follows hover
    for (const [key, r] of Object.entries(routes)) {
      const hot = state.focus === key || state.focus === 'any'
      const dim = state.focus && !hot
      r.tick(t, hot, dim)
    }

    placeLabels()
    renderer.render(scene, camera)
  }
  function setRunning(on) {
    if (on && !raf) { raf = requestAnimationFrame(frame) }
    if (!on && raf) { cancelAnimationFrame(raf); raf = 0 }
  }

  if (reduced) {
    // single static frame, no animation
    applyCamera(); placeLabels(); renderer.render(scene, camera)
    return
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; setRunning(visible && !document.hidden) }, { rootMargin: '120px' })
    .observe(root)
  document.addEventListener('visibilitychange', () => setRunning(visible && !document.hidden))
  setRunning(true)
}

/* ---------- builders ---------- */

function makeCity(v, color) {
  const group = new THREE.Group()
  const dot = new THREE.Mesh(
    new THREE.CircleGeometry(0.075, 24),
    new THREE.MeshBasicMaterial({ color })
  )
  dot.rotation.x = -Math.PI / 2
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.16, 0.2, 40),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
  )
  ring.rotation.x = -Math.PI / 2
  group.add(dot, ring)
  group.position.copy(v).setY(0.02)
  return {
    group,
    tick(t) {
      const s = 1 + Math.sin(t * 2.2 + v.x) * 0.12
      ring.scale.setScalar(s)
      ring.material.opacity = 0.55 + Math.sin(t * 2.2 + v.x) * 0.25
    },
  }
}

function makeRadar(origin) {
  const group = new THREE.Group()
  group.position.copy(origin).setY(0.03)
  const rings = []
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(0.96, 1, 64),
      new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    )
    m.rotation.x = -Math.PI / 2
    group.add(m)
    rings.push({ m, off: i / 3 })
  }
  return {
    group,
    tick(t, hot) {
      const speed = hot ? 0.55 : 0.22
      const amp = hot ? 0.5 : 0.16
      for (const { m, off } of rings) {
        const p = ((t * speed) + off) % 1
        m.scale.setScalar(0.15 + p * 2.1)
        m.material.opacity = (1 - p) * amp
      }
    },
  }
}

function makeRoute(a, b, lift, color) {
  const group = new THREE.Group()
  const mid = a.clone().lerp(b, 0.5); mid.y = lift
  const curve = new THREE.QuadraticBezierCurve3(a.clone().setY(0.03), mid, b.clone().setY(0.03))

  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 72, 0.018, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4, depthWrite: false })
  )
  group.add(tube)

  // travelling pulses: bright sprites moving along the curve
  const pulses = []
  const tex = pulseTex()
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, color, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }))
    s.scale.setScalar(0.34)
    group.add(s)
    pulses.push({ s, off: i / 3 })
  }

  const base = { op: 0.4, speed: 0.14, size: 0.34 }
  return {
    group,
    tick(t, hot, dim) {
      const op = hot ? 0.95 : dim ? 0.12 : base.op
      tube.material.opacity += (op - tube.material.opacity) * 0.12
      const speed = hot ? base.speed * 2.2 : base.speed
      for (const { s, off } of pulses) {
        const p = ((t * speed) + off) % 1
        curve.getPoint(p, s.position)
        const fade = Math.sin(p * Math.PI) // soft in/out at endpoints
        s.material.opacity = (hot ? 1 : dim ? 0.1 : 0.8) * fade
        s.scale.setScalar((hot ? base.size * 1.5 : base.size) * (0.7 + fade * 0.5))
      }
    },
  }
}

function makeStars() {
  const N = 160
  const pos = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 36
    pos[i * 3 + 1] = 2.5 + Math.random() * 9
    pos[i * 3 + 2] = -4 - Math.random() * 14
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  return new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xcfd8e3, size: 0.05, transparent: true, opacity: 0.7,
    depthWrite: false, sizeAttenuation: true,
  }))
}

/* ---------- tiny canvas textures ---------- */

function radialTex(rgba) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, rgba)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(c)
}

function pulseTex() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,.5)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

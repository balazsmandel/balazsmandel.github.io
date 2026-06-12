// Night-road light streaks behind the "30 years on the road" divider —
// long-exposure highway lights flying past the camera (white/gold headlights
// on the right, red tail lights on the left), like three decades of night
// drives compressed into one shot.
import * as THREE from 'three'

const INK = 0x07090c

export function initWarp(canvas) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const section = canvas.closest('.divider')
  if (!section) return

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(INK, 18, 70)
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 90)
  camera.position.set(0, 0, 10)

  const mobile = window.innerWidth < 768
  const COUNT = mobile ? 40 : 80
  const streaks = []
  const colors = {
    head: [0xfff4d6, 0xe7c884, 0xffffff],
    tail: [0xff5a4d, 0xd93a30, 0xff8e6e],
  }
  const geo = new THREE.BoxGeometry(1, 1, 1)
  for (let i = 0; i < COUNT; i++) {
    const left = Math.random() < 0.45
    const pal = left ? colors.tail : colors.head
    const mat = new THREE.MeshBasicMaterial({
      color: pal[(Math.random() * pal.length) | 0],
      transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false,
    })
    const m = new THREE.Mesh(geo, mat)
    const r = 2.2 + Math.random() * 6.5
    const a = Math.random() * Math.PI * 2
    // keep streaks out of the screen centre so the big "30" stays readable:
    // bias to the sides by stretching x
    m.position.set(Math.cos(a) * r * 1.5 * (left ? -0.9 : 0.9) - (left ? 2 : -2),
      Math.sin(a) * r * 0.5, -70 + Math.random() * 76)
    const len = 2.5 + Math.random() * 5
    m.scale.set(0.035, 0.035, len)
    streaks.push({ m, v: 16 + Math.random() * 26, target: 0.25 + Math.random() * 0.3 })
    scene.add(m)
  }

  function resize() {
    const w = section.clientWidth, h = section.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  let raf = 0, visible = false, last = 0
  function frame(now) {
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016)
    last = now
    for (const s of streaks) {
      s.m.position.z += s.v * dt
      // fade in from the deep, fade out as it passes the camera
      const z = s.m.position.z
      s.m.material.opacity = z > 6 ? Math.max(0, s.target * (1 - (z - 6) / 4)) : s.target * Math.min(1, (z + 70) / 14)
      if (z > 10) { s.m.position.z = -70; s.m.material.opacity = 0 }
    }
    camera.rotation.z = Math.sin(now / 9000) * 0.035
    renderer.render(scene, camera)
  }
  function setRunning(on) {
    if (on && !raf) { last = 0; raf = requestAnimationFrame(frame) }
    if (!on && raf) { cancelAnimationFrame(raf); raf = 0 }
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; setRunning(visible && !document.hidden) }, { rootMargin: '60px' })
    .observe(section)
  document.addEventListener('visibilitychange', () => setRunning(visible && !document.hidden))
}

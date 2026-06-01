// Scroll-driven 3D car showcase.
// Tries to load a GLB model from /assets/models/car.glb; if absent, builds a
// stylized low-poly car in code so the section always works.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

let renderer, scene, camera, carGroup, raf
const GOLD = 0xe7c884

export function initCar3D(canvas) {
  if (renderer) return // once
  const wrap = canvas.parentElement
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  camera.position.set(0, 1.4, 6.2)
  camera.lookAt(0, 0.5, 0)

  // lighting — dark, premium, gold rim
  scene.add(new THREE.AmbientLight(0x404a55, 1.1))
  const key = new THREE.DirectionalLight(0xffffff, 2.2)
  key.position.set(4, 6, 5)
  scene.add(key)
  const rim = new THREE.DirectionalLight(GOLD, 2.4)
  rim.position.set(-5, 3, -4)
  scene.add(rim)
  const teal = new THREE.PointLight(0x1aa6b0, 18, 20)
  teal.position.set(3, 1, -3)
  scene.add(teal)

  // gold turntable glow
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.1, 2.35, 64),
    new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = -0.62
  scene.add(ring)

  carGroup = new THREE.Group()
  scene.add(carGroup)

  const loader = new GLTFLoader()
  loader.load(
    '/assets/models/car.glb',
    (gltf) => {
      const m = gltf.scene
      // normalize size/position
      const box = new THREE.Box3().setFromObject(m)
      const size = box.getSize(new THREE.Vector3())
      const s = 3.4 / Math.max(size.x, size.y, size.z)
      m.scale.setScalar(s)
      const c = box.getCenter(new THREE.Vector3())
      m.position.sub(c.multiplyScalar(s))
      carGroup.add(m)
    },
    undefined,
    () => buildStylizedCar(carGroup) // fallback on error/404
  )

  resize(wrap)
  window.addEventListener('resize', () => resize(wrap))
  loop()
}

function resize(wrap) {
  const w = wrap.clientWidth, h = wrap.clientHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

function loop() {
  raf = requestAnimationFrame(loop)
  renderer.render(scene, camera)
}

/** progress 0..1 from ScrollTrigger → rotate the car a full turn */
export function setCarProgress(p) {
  if (carGroup) carGroup.rotation.y = p * Math.PI * 2
}

export function disposeCar3D() {
  if (raf) cancelAnimationFrame(raf)
}

// ---- code fallback: a clean stylized car silhouette ----
function buildStylizedCar(group) {
  const body = new THREE.MeshStandardMaterial({ color: 0x10141a, metalness: 0.7, roughness: 0.35 })
  const glass = new THREE.MeshStandardMaterial({ color: 0x0c2026, metalness: 0.9, roughness: 0.1 })
  const trim = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.3 })

  const lower = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.7, 1.5), body)
  lower.position.y = 0.05
  round(lower)
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.62, 1.36), glass)
  cabin.position.set(-0.1, 0.6, 0)
  round(cabin)
  group.add(lower, cabin)

  // wheels
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 24)
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x05070a, metalness: 0.4, roughness: 0.6 })
  const hub = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.3 })
  ;[[-1.05, -0.7], [1.05, -0.7], [-1.05, 0.7], [1.05, 0.7]].forEach(([x, z]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat)
    w.rotation.x = Math.PI / 2
    w.position.set(x, -0.28, z)
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.28, 16), hub)
    h.rotation.x = Math.PI / 2
    h.position.copy(w.position)
    group.add(w, h)
  })

  // headlight bars (gold)
  const hl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 1.2), trim)
  hl.position.set(1.71, 0.12, 0)
  group.add(hl)
}

function round() { /* placeholder for future bevel; keeps call sites tidy */ }

import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

export function initScroll() {
  // reveals work even with reduced motion (just shown instantly)
  if (reduced) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'))
    return
  }

  // --- Lenis smooth scroll ---
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)

  // smooth in-page anchor scrolling (nav, price cards, CTAs)
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')
      if (id.length > 1) {
        const target = document.querySelector(id)
        if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -10 }) }
      }
    })
  })

  // --- reveals via IntersectionObserver (reliable + clearly visible) ---
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }),
    { threshold: 0.15 }
  )
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el))

  // --- hero parallax ---
  const heroBg = document.querySelector('.hero-bg')
  if (heroBg) {
    gsap.to(heroBg, {
      yPercent: 28, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    })
  }

  // --- divider parallax ---
  const divBg = document.querySelector('.divider-bg')
  if (divBg) {
    gsap.fromTo(divBg, { yPercent: -14 }, {
      yPercent: 14, ease: 'none',
      scrollTrigger: { trigger: '.divider', start: 'top bottom', end: 'bottom top', scrub: true },
    })
  }

  // --- count-up numbers (formatted) ---
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count)
    const obj = { v: 0 }
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(obj, {
        v: end, duration: 1.4, ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('hu-HU') },
      }),
    })
  })

}

// Pinned section: e-Niro 360° spin (image sequence) → cross-fade to Octavia.
function wireFleet() {
  const section = document.getElementById('fleet')
  if (!section) return
  const spin = document.getElementById('kia-spin')
  const frames = spin ? Array.from(spin.querySelectorAll('.frame')) : []
  const N = frames.length
  const octavia = document.getElementById('car-octavia')
  const iKia = document.getElementById('info-kia')
  const iOct = document.getElementById('info-octavia')
  const base = 'translate(-50%,-50%)'
  let cur = 0

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=240%',
    pin: '.fleet-stage',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress
      // e-Niro 360° spin across the whole pinned section (Octavia spin added later)
      const sp = clamp(p / 0.92, 0, 1)
      const idx = Math.min(N - 1, Math.floor(sp * N))
      if (N && idx !== cur) {
        frames[cur].classList.remove('on')
        frames[idx].classList.add('on')
        cur = idx
      }
      if (octavia) octavia.style.opacity = 0
      if (iKia) iKia.style.opacity = 1
      if (iOct) iOct.style.opacity = 0
    },
  })
}

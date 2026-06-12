import '../styles/main.css'
import { applyLang, detectLang, FLAG } from './i18n.js'
import { initScroll } from './scroll.js'

// ---------- language ----------
let lang = detectLang()
applyLang(lang)

const langBtn = document.getElementById('langbtn')
const langMenu = document.getElementById('langmenu')
function setLang(l) {
  lang = l
  localStorage.setItem('lang', l)
  applyLang(l)
  if (langBtn) langBtn.textContent = FLAG[l] + ' ▾'
  langMenu?.classList.remove('open')
}
if (langBtn) {
  langBtn.textContent = FLAG[lang] + ' ▾'
  langBtn.addEventListener('click', (e) => { e.stopPropagation(); langMenu.classList.toggle('open') })
}
document.querySelectorAll('[data-lang]').forEach((b) =>
  b.addEventListener('click', () => setLang(b.dataset.lang))
)
document.addEventListener('click', () => langMenu?.classList.remove('open'))

// ---------- nav scrolled state ----------
const nav = document.getElementById('nav')
const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 40)
window.addEventListener('scroll', onScroll, { passive: true })
onScroll()

// ---------- mobile menu ----------
const burger = document.getElementById('burger')
const navlinks = document.getElementById('navlinks')
burger?.addEventListener('click', () => navlinks.classList.toggle('open'))
navlinks?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => navlinks.classList.remove('open')))

// ---------- quote form (Web3Forms) ----------
const form = document.getElementById('quote-form')
const status = document.getElementById('form-status')
form?.addEventListener('submit', async (e) => {
  e.preventDefault()
  const data = new FormData(form)
  status.textContent = '…'
  status.className = 'form-status'
  try {
    const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data })
    const json = await res.json()
    if (json.success) {
      status.dataset.i18n = 'f_success'
      status.textContent = form.dataset.success
      status.classList.add('ok')
      form.reset()
      window.gtag?.('event', 'quote_submit')
    } else throw new Error('fail')
  } catch {
    status.dataset.i18n = 'f_error'
    status.textContent = form.dataset.error
    status.classList.add('err')
  }
})

// track conversions
document.querySelectorAll('a[href^="tel:"]').forEach((a) =>
  a.addEventListener('click', () => window.gtag?.('event', 'call_click')))
document.querySelectorAll('a[href*="wa.me"]').forEach((a) =>
  a.addEventListener('click', () => window.gtag?.('event', 'whatsapp_click')))

// ---------- card 3D tilt (services + prices, desktop pointers only) ----------
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.card, .price').forEach((card) => {
    card.addEventListener('mouseenter', () => { card.style.transition = 'transform .1s ease-out, box-shadow .25s, border-color .25s' })
    card.addEventListener('mousemove', (e) => {
      const b = card.getBoundingClientRect()
      const rx = ((e.clientY - b.top) / b.height - 0.5) * -12
      const ry = ((e.clientX - b.left) / b.width - 0.5) * 12
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(14px)`
      card.style.borderColor = 'rgba(231,200,132,.55)'
      card.style.boxShadow = '0 26px 60px rgba(0,0,0,.45)'
    })
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform .5s ease, box-shadow .4s, border-color .4s'
      card.style.transform = ''
      card.style.borderColor = ''
      card.style.boxShadow = ''
    })
  })
}

// ---------- magnetic buttons (desktop pointers only) ----------
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const b = el.getBoundingClientRect()
      el.style.transform = `translate(${(e.clientX - b.left - b.width / 2) * 0.25}px, ${(e.clientY - b.top - b.height / 2) * 0.4}px)`
    })
    el.addEventListener('mouseleave', () => { el.style.transform = '' })
  })
}

// ---------- scroll choreography ----------
initScroll()

// ---------- 3D / motion layers (lazy: three.js only loads when needed) ----------
const hero = document.querySelector('.hero')
if (hero) import('./fx/hero3d.js').then((m) => m.initHeroFX(hero))

const routesEl = document.getElementById('routes3d')
if (routesEl) {
  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      io.disconnect()
      import('./fx/routes3d.js').then((m) => m.initRoutes3D(routesEl))
    }
  }, { rootMargin: '600px' })
  io.observe(routesEl)
}

const warpCanvas = document.getElementById('warp')
if (warpCanvas) {
  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      io.disconnect()
      import('./fx/warp.js').then((m) => m.initWarp(warpCanvas))
    }
  }, { rootMargin: '600px' })
  io.observe(warpCanvas)
}

import('./fx/fleetfx.js').then((m) => m.initFleetFX())

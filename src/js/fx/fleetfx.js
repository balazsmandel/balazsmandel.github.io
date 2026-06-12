// Fleet "showroom" effects — mirror-floor reflection under each car cutout
// plus a scroll-driven 3D sweep (the car turns slightly as it passes through
// the viewport). Pure DOM + GSAP, no WebGL needed here.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initFleetFX() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  document.querySelectorAll('.car-row .car-img').forEach((wrap, i) => {
    const img = wrap.querySelector('img')
    if (!img) return

    // wrap image in a 3D stage so GSAP's rotate doesn't fight the CSS :hover
    // transform that lives on the <img> itself
    const stage = document.createElement('div')
    stage.className = 'car-3d'
    wrap.insertBefore(stage, img)
    stage.appendChild(img)

    // mirror reflection (decorative only)
    const refl = img.cloneNode()
    refl.className = 'car-reflect'
    refl.alt = ''
    refl.loading = 'lazy'
    refl.setAttribute('aria-hidden', 'true')
    stage.appendChild(refl)

    if (reduced) return

    const dir = wrap.closest('.car-row')?.classList.contains('reverse') ? -1 : 1
    gsap.fromTo(stage,
      { rotationY: 9 * dir, rotationX: 2 },
      {
        rotationY: -9 * dir, rotationX: -1, ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true },
      })
  })
}

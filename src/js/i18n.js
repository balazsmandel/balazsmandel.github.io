import hu from '../i18n/hu.json'
import en from '../i18n/en.json'
import de from '../i18n/de.json'

const DICT = { hu, en, de }
export const LANGS = ['hu', 'en', 'de']
export const FLAG = { hu: 'HU', en: 'EN', de: 'DE' }

/** Apply a language to all [data-i18n] (innerHTML), [data-i18n-attr] (attributes),
 *  and document meta (title/description/html lang). */
export function applyLang(lang) {
  const d = DICT[lang] || DICT.hu
  document.documentElement.lang = lang

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = d[el.dataset.i18n]
    if (v != null) el.innerHTML = v
  })

  // data-i18n-attr="placeholder:ph_from,aria-label:f_from"
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim())
      if (d[key] != null) el.setAttribute(attr, d[key])
    })
  })

  // meta
  if (d.meta_title) document.title = d.meta_title
  const md = document.querySelector('meta[name="description"]')
  if (md && d.meta_desc) md.setAttribute('content', d.meta_desc)
}

export function detectLang() {
  // a pre-rendered localized page pins the language
  if (window.__LANG__ && LANGS.includes(window.__LANG__)) return window.__LANG__
  const saved = localStorage.getItem('lang')
  if (saved && LANGS.includes(saved)) return saved
  const nav = (navigator.language || 'hu').slice(0, 2)
  return LANGS.includes(nav) ? nav : 'hu'
}

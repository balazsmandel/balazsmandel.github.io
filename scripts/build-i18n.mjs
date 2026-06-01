// Post-build: generate localized /en/ and /de/ pages + sitemap from dist/index.html.
// Crawlers get translated <title>/<description>/<html lang>/canonical/hreflang and
// (best-effort) translated body text; the client also applies the pinned language.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const dist = join(root, 'dist')
const SITE = 'https://mandeltranszfer.hu'
const load = (f) => JSON.parse(readFileSync(join(root, 'src', 'i18n', f), 'utf8'))
const DICT = { hu: load('hu.json'), en: load('en.json'), de: load('de.json') }

const src = readFileSync(join(dist, 'index.html'), 'utf8')

function localize(html, lang) {
  const d = DICT[lang]
  let out = html

  // html lang + pinned language for the client
  out = out.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`)
  out = out.replace('<head>', `<head>\n  <script>window.__LANG__=${JSON.stringify(lang)}</script>`)

  // title + description
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${d.meta_title}</title>`)
  out = out.replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeAttr(d.meta_desc)}$2`)

  // canonical for this locale
  const path = lang === 'hu' ? '/' : `/${lang}/`
  out = out.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${SITE}${path}$2`)

  // OG
  out = out.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeAttr(d.meta_title)}$2`)
  out = out.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeAttr(d.meta_desc)}$2`)
  out = out.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${SITE}${path}$2`)

  // best-effort: translate simple single-text-node [data-i18n] elements
  out = out.replace(/data-i18n="([a-z0-9_]+)"([^>]*)>([^<]*)</gi, (m, key, attrs, txt) => {
    if (d[key] != null && !/[<]/.test(txt)) return `data-i18n="${key}"${attrs}>${d[key]}<`
    return m
  })

  return out
}
const escapeAttr = (s) => s.replace(/"/g, '&quot;')

for (const lang of ['en', 'de']) {
  const dir = join(dist, lang)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), localize(src, lang))
  console.log(`✓ dist/${lang}/index.html`)
}

// sitemap
const urls = ['/', '/en/', '/de/']
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n') +
  `\n</urlset>\n`
writeFileSync(join(dist, 'sitemap.xml'), sitemap)
console.log('✓ dist/sitemap.xml')

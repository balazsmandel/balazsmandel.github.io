// Verifies that en.json and de.json have exactly the same keys as hu.json.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const load = (f) => JSON.parse(readFileSync(join(here, '..', 'src', 'i18n', f), 'utf8'))

const hu = load('hu.json')
const base = Object.keys(hu).sort()
let failed = false

for (const name of ['en.json', 'de.json']) {
  const d = load(name)
  const k = Object.keys(d).sort()
  const missing = base.filter((x) => !k.includes(x))
  const extra = k.filter((x) => !base.includes(x))
  if (missing.length || extra.length) {
    failed = true
    console.error(`✗ ${name} mismatch`, { missing, extra })
  } else {
    console.log(`✓ ${name} OK (${k.length} keys)`)
  }
}
process.exit(failed ? 1 : 0)

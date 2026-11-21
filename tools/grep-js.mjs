// Download every script a page loads and grep them.
// Usage: node tools/grep-js.mjs <url> <regex> [context=200] [--save]
//   --save writes each script to .measure/js/<name> for closer reading
import { chromium } from 'playwright-core'
import { mkdirSync, writeFileSync } from 'node:fs'
const args = process.argv.slice(2)
const [url, pattern, ctx = '200'] = args.filter((a) => !a.startsWith('--'))
const save = args.includes('--save')
const re = new RegExp(pattern, 'g')
const b = await chromium.launch({ channel: 'chrome' })
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })).newPage()
const bodies = new Map()
p.on('response', async (r) => {
  if (r.request().resourceType() !== 'script') return
  try { bodies.set(r.url(), await r.text()) } catch {}
})
await p.goto(url, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
await p.waitForTimeout(3000)
if (save) mkdirSync('.measure/js', { recursive: true })
for (const [u, text] of bodies) {
  const name = u.split('/').pop().split('?')[0] || 'index.js'
  if (save) writeFileSync(`.measure/js/${name}`, text)
  const hits = [...text.matchAll(re)]
  if (!hits.length) continue
  console.log(`\n=== ${name} (${text.length} chars, ${hits.length} hits)`)
  for (const h of hits.slice(0, 6)) console.log('  …' + text.slice(Math.max(0, h.index - +ctx), h.index + +ctx).replace(/\s+/g, ' ') + '…')
}
await b.close()

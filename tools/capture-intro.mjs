// Screenshot our intro at exact times after "fadeout" (deterministic seeking).
// Usage: node tools/capture-intro.mjs <url> <W>x<H> <t1,t2,...> <outPrefix> [--mobile] [--dpr=1]
// Needs the app's ?intro=manual mode (src/intro/intro.js).
// Output: <outPrefix>-<t>.png
import { chromium } from 'playwright-core'
const args = process.argv.slice(2)
const [url, vp, times, out] = args.filter((a) => !a.startsWith('--'))
const mobile = args.includes('--mobile')
const dpr = Number(args.find((a) => a.startsWith('--dpr='))?.split('=')[1] ?? 1)
const [w, h] = vp.split('x').map(Number)
const b = await chromium.launch({ channel: 'chrome' })
const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile })
const p = await ctx.newPage()
p.on('console', (m) => m.type() === 'error' && console.log('[page error]', m.text()))
p.on('pageerror', (e) => console.log('[pageerror]', e.message))
const sep = url.includes('?') ? '&' : '?'
await p.goto(`${url}${sep}intro=manual`, { waitUntil: 'networkidle' })
await p.waitForFunction(() => window.__intro?.ready, null, { timeout: 30000 })
console.log('layout', await p.evaluate(() => window.__intro.layout), 'timeline end', await p.evaluate(() => window.__intro.end))
for (const t of times.split(',').map(Number)) {
  await p.evaluate((t) => window.__intro.seek(t), t)
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  const file = `${out}-${t.toFixed(2)}.png`
  await p.screenshot({ path: file })
  console.log('->', file)
}
await b.close()

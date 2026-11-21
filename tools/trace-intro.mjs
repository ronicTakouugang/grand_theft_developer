// Record, every animation frame from page load, the opacity / scale of the
// elements that take part in the loader + intro. t=0 is "fadeout": the first
// frame the loader logo's opacity drops below 1.
//
// Usage: node tools/trace-intro.mjs <url> <selectors.json> <out-name> [WxH=1440x900] [--live] [--mobile]
//   selectors.json: { "name": "css selector", ... }
// Output: .measure/<out-name>.json  { t0, samples: [{t, name: {op, sc}}] }
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const args = process.argv.slice(2)
const live = args.includes('--live')
const mobile = args.includes('--mobile')
const [url, selFile, outName, vp = '1440x900'] = args.filter((a) => !a.startsWith('--'))
const sel = JSON.parse(readFileSync(selFile, 'utf8').replace(/^\uFEFF/, ''))
const [w, h] = vp.split('x').map(Number)

const b = await chromium.launch({ channel: 'chrome' })
const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'en-US', isMobile: mobile, hasTouch: mobile })
const p = await ctx.newPage()
await p.addInitScript(({ sel, live }) => {
  if (live) {
    const add = () => { const s = document.createElement('style'); s.textContent = ':root{--_1qwkqln0:0 !important}._1bkvte7{display:none!important}#onetrust-consent-sdk{display:none!important}'; document.documentElement.appendChild(s) }
    document.documentElement ? add() : document.addEventListener('DOMContentLoaded', add)
  }
  window.__trace = []
  const read = (el) => {
    if (!el) return null
    const s = getComputedStyle(el)
    let op = parseFloat(s.opacity)
    if (s.visibility === 'hidden' || s.display === 'none') op = 0
    const m = s.transform.match(/matrix\(([^,]+)/)
    return { op: +op.toFixed(4), sc: m ? +parseFloat(m[1]).toFixed(4) : 1 }
  }
  const tick = () => {
    const row = { t: performance.now() }
    for (const [n, q] of Object.entries(sel)) row[n] = read(document.querySelector(q))
    window.__trace.push(row)
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}, { sel, live })
await p.goto(url, { waitUntil: 'load', timeout: 90000 }).catch(() => {})
await p.waitForTimeout(16000)
const trace = await p.evaluate(() => window.__trace)
await b.close()

// t0 = first frame the loader logo starts fading
const i0 = trace.findIndex((r, i) => i > 0 && r.loaderLogo && trace[i - 1].loaderLogo?.op === 1 && r.loaderLogo.op < 1)
const t0 = i0 >= 0 ? trace[i0 - 1].t : null
const samples = trace.map((r) => {
  const o = { t: t0 == null ? null : +((r.t - t0) / 1000).toFixed(4) }
  for (const k of Object.keys(sel)) o[k] = r[k]
  return o
})
mkdirSync('.measure', { recursive: true })
writeFileSync(`.measure/${outName}.json`, JSON.stringify({ t0, frames: trace.length, samples }, null, 1))
console.log(`-> .measure/${outName}.json  frames=${trace.length} t0=${t0 && (t0 / 1000).toFixed(3)}s after navigation`)

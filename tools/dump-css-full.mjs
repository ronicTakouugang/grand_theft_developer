// Dump CSS rules whose selector contains a needle, plus any @keyframes they use
// (dump-css.mjs skips keyframes).
// Usage: node tools/dump-css-full.mjs <url> <needle> [needle...]
import { chromium } from 'playwright-core'
const [url, ...needles] = process.argv.slice(2)
const launchOpts = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }
const b = await chromium.launch({ headless: true, ...launchOpts })
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })).newPage()
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {})
await p.waitForTimeout(1500)
console.log(await p.evaluate((needles) => {
  const out = []
  const frames = new Map()
  const anims = new Set()
  const walk = (rules, ctx) => {
    for (const r of rules) {
      if (r instanceof CSSKeyframesRule) { frames.set(r.name, r.cssText); continue }
      if (r instanceof CSSStyleRule) {
        if (needles.some((n) => r.selectorText.includes(n))) {
          out.push(`${ctx}${r.selectorText} { ${r.style.cssText} }`)
          const a = r.style.animationName || r.style.animation
          if (a) a.split(/[\s,]+/).forEach((x) => anims.add(x))
        }
        if (r.cssRules?.length) walk(r.cssRules, ctx + r.selectorText + ' > ')
      } else if (r.cssRules) walk(r.cssRules, `${ctx}@${r.conditionText ?? r.media?.mediaText ?? ''} > `)
    }
  }
  for (const s of document.styleSheets) { try { walk(s.cssRules, '') } catch {} }
  for (const [n, t] of frames) if (anims.has(n)) out.push(t)
  return out.join('\n')
}, needles))
await b.close()

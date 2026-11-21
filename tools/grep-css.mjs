// Find CSS rules whose *declarations* contain a substring (dump-css matches selectors).
// Usage: node tools/grep-css.mjs <url> <substr> [maxLen=400]
import { chromium } from 'playwright-core'
const [url, needle, maxLen = '400'] = process.argv.slice(2)
const launchOpts = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }
const b = await chromium.launch({ headless: true, ...launchOpts })
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })).newPage()
await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
const out = await p.evaluate(({ needle, maxLen }) => {
  const res = []
  const walk = (rules, ctx) => {
    for (const r of rules) {
      if (r instanceof CSSStyleRule) {
        const t = r.style.cssText
        const i = t.indexOf(needle)
        if (i >= 0) res.push(`${ctx.join(' > ')}${ctx.length ? ' > ' : ''}${r.selectorText} { …${t.slice(Math.max(0, i - 20), i + maxLen)} }`)
        if (r.cssRules?.length) walk(r.cssRules, [...ctx, r.selectorText])
      } else if (r.cssRules) {
        walk(r.cssRules, [...ctx, `@${r.conditionText ?? r.media?.mediaText ?? r.name ?? ''}`])
      }
    }
  }
  for (const s of document.styleSheets) { try { walk(s.cssRules, []) } catch {} }
  return res.join('\n')
}, { needle, maxLen: +maxLen })
console.log(out)
await b.close()

// Dump every CSS rule (incl. inside @media/@container/@supports) whose selector
// mentions one of the given class names / substrings. Also lists :root custom
// properties when "--vars" is passed.
// Usage: node tools/dump-css.mjs <url> <out-name> <substr> [substr...] [--vars]
// Output: .measure/css-<out-name>.txt

import { chromium } from 'playwright-core'
import { mkdirSync, writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const [url, name, ...rest] = args
const wantVars = rest.includes('--vars')
const needles = rest.filter((a) => a !== '--vars')

const launchOpts = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }
const browser = await chromium.launch({ headless: true, ...launchOpts })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })
const page = await ctx.newPage()
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
await page.waitForTimeout(3000)

const text = await page.evaluate(
  ({ needles, wantVars }) => {
    const out = []
    const walk = (rules, ctx) => {
      for (const r of rules) {
        if (r.cssRules && !(r instanceof CSSStyleRule)) {
          const head = r.conditionText ?? r.media?.mediaText ?? r.name ?? r.constructor.name
          walk(r.cssRules, [...ctx, `${r.constructor.name.replace('CSS', '').replace('Rule', '')}(${head})`])
          continue
        }
        if (!(r instanceof CSSStyleRule)) continue
        const sel = r.selectorText
        if (needles.some((n) => sel.includes(n)) || (wantVars && (sel === ':root' || sel === 'html' || sel === 'body'))) {
          out.push(`${ctx.length ? ctx.join(' > ') + ' > ' : ''}${sel} { ${r.style.cssText} }`)
        }
        if (r.cssRules?.length) walk(r.cssRules, [...ctx, sel])
      }
    }
    for (const sh of document.styleSheets) {
      try {
        walk(sh.cssRules, [])
      } catch {
        out.push(`/* cannot read ${sh.href} */`)
      }
    }
    return out.join('\n')
  },
  { needles, wantVars },
)

mkdirSync('.measure', { recursive: true })
const file = `.measure/css-${name}.txt`
writeFileSync(file, text)
console.log('->', file, text.split('\n').length, 'rules')
await browser.close()

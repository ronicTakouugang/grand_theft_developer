// Dump page-level basics from a URL: background colours, font families in use,
// favicon / theme-color tags. Output goes to .measure/base-<host>-<width>.json.
//
// Usage: node tools/measure-base.mjs <url> [width=1440] [height=900]
// Needs a local Chrome (uses channel "chrome"); set CHROME_PATH to override.

import { chromium } from 'playwright-core'
import { mkdirSync, writeFileSync } from 'node:fs'

const [url, w = '1440', h = '900'] = process.argv.slice(2)
if (!url) {
  console.error('usage: node tools/measure-base.mjs <url> [width] [height]')
  process.exit(1)
}

const launchOpts = process.env.CHROME_PATH
  ? { executablePath: process.env.CHROME_PATH }
  : { channel: 'chrome' }
const browser = await chromium.launch({ headless: true, ...launchOpts })
const page = await browser.newPage({
  viewport: { width: +w, height: +h },
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
})
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
await page.waitForTimeout(4000)

const data = await page.evaluate(() => {
  const cs = (el) => (el ? getComputedStyle(el) : null)
  const html = cs(document.documentElement)
  const body = cs(document.body)
  const families = new Map()
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el)
    if (!el.textContent.trim() || s.display === 'none') continue
    const k = `${s.fontFamily} | ${s.fontWeight}`
    families.set(k, (families.get(k) || 0) + 1)
  }
  return {
    title: document.title,
    htmlBg: html.backgroundColor,
    bodyBg: body.backgroundColor,
    bodyColor: body.color,
    bodyFont: body.fontFamily,
    colorScheme: html.colorScheme,
    head: [...document.querySelectorAll('link[rel*=icon], link[rel=manifest], meta[name=theme-color], meta[name=color-scheme]')].map(
      (n) => n.outerHTML,
    ),
    fontFaces: [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.style} ${f.status}`),
    families: [...families].sort((a, b) => b[1] - a[1]).slice(0, 15),
  }
})

await page.screenshot({ path: `.measure/base-${new URL(url).host}-${w}.png` }).catch(() => {})
mkdirSync('.measure', { recursive: true })
const out = `.measure/base-${new URL(url).host}-${w}.json`
writeFileSync(out, JSON.stringify(data, null, 2))
console.log(JSON.stringify(data, null, 2))
console.log('->', out)
await browser.close()

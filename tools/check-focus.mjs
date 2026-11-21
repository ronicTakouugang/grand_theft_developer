// Tab through a page and report each focused element + whether it shows an outline.
// Usage: node tools/check-focus.mjs <url> [width=1440] [height=900] [tabs=8]
// Screenshots: .measure/shots/focus-<n>.png
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
const [url, w = '1440', h = '900', tabs = '8'] = process.argv.slice(2)
const launchOpts = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }
const b = await chromium.launch({ headless: true, ...launchOpts })
const p = await (await b.newContext({ viewport: { width: +w, height: +h }, reducedMotion: 'reduce' })).newPage()
await p.goto(url, { waitUntil: 'networkidle' })
mkdirSync('.measure/shots', { recursive: true })
for (let i = 1; i <= +tabs; i++) {
  await p.keyboard.press('Tab')
  await p.waitForTimeout(250)
  const info = await p.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return null
    const s = getComputedStyle(el)
    return { tag: el.tagName, label: el.getAttribute('aria-label') || el.textContent.trim(), outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}` }
  })
  if (!info) { console.log(i, 'focus left the page'); break }
  console.log(i, info)
  await p.screenshot({ path: `.measure/shots/focus-${i}.png` })
}
await b.close()

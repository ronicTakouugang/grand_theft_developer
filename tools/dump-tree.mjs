// Dump the visible DOM tree (tag, classes, box, key styles) under a root selector.
// Usage: node tools/dump-tree.mjs <url> <width> <height> [rootSelector=body] [maxDepth=12] [scrollY=0]
// Output: .measure/tree-<host>-<width>-<scrollY>.txt  (+ a screenshot .png)

import { chromium } from 'playwright-core'
import { mkdirSync, writeFileSync } from 'node:fs'

const [url, w = '1440', h = '900', root = 'body', maxDepth = '12', scrollY = '0'] = process.argv.slice(2)
const launchOpts = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }
const browser = await chromium.launch({ headless: true, ...launchOpts })
const ctx = await browser.newContext({
  viewport: { width: +w, height: +h },
  locale: 'en-US',
  extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
})
const page = await ctx.newPage()
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
await page.waitForTimeout(6000)
if (+scrollY) {
  await page.mouse.wheel(0, +scrollY)
  await page.waitForTimeout(2500)
}

const text = await page.evaluate(
  ({ root, maxDepth }) => {
    const out = []
    const walk = (el, d) => {
      if (d > maxDepth) return
      const s = getComputedStyle(el)
      if (s.display === 'none') return
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0 && el.children.length === 0) return
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''
      const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').slice(0, 60)
      const extra = []
      if (own) extra.push(`"${own}" ${s.fontFamily.split(',')[0]} ${s.fontSize}/${s.lineHeight} w${s.fontWeight} ls${s.letterSpacing} ${s.textTransform} c=${s.color}`)
      if (s.position !== 'static') extra.push(`pos=${s.position}`)
      if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') extra.push(`bg=${s.backgroundColor}`)
      if (s.backgroundImage !== 'none') extra.push(`bgimg=${s.backgroundImage.slice(0, 80)}`)
      if (s.opacity !== '1') extra.push(`op=${s.opacity}`)
      if (s.transform !== 'none') extra.push(`tf=${s.transform}`)
      if (s.borderRadius !== '0px') extra.push(`br=${s.borderRadius}`)
      if (s.zIndex !== 'auto') extra.push(`z=${s.zIndex}`)
      if (s.visibility !== 'visible') extra.push(`vis=${s.visibility}`)
      if (el.tagName === 'IMG') extra.push(`img=${el.currentSrc.split('/').pop().slice(0, 50)} nat=${el.naturalWidth}x${el.naturalHeight} fit=${s.objectFit} op=${s.objectPosition}`)
      if (el.getAttribute('aria-label')) extra.push(`aria="${el.getAttribute('aria-label')}"`)
      out.push(
        `${'  '.repeat(d)}${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''} [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}] ${extra.join(' ')}`,
      )
      for (const c of el.children) walk(c, d + 1)
    }
    const r = document.querySelector(root)
    if (!r) return `no match for ${root}`
    walk(r, 0)
    return out.join('\n')
  },
  { root, maxDepth: +maxDepth },
)

mkdirSync('.measure', { recursive: true })
const base = `.measure/tree-${new URL(url).host.replace(/[:]/g, '_')}-${w}-${scrollY}`
writeFileSync(base + '.txt', text)
await page.screenshot({ path: base + '.png' })
console.log('->', base + '.txt', text.split('\n').length, 'lines')
await browser.close()

// Measure named elements at a set of viewports and write JSON for diffing.
//
// Usage:
//   node tools/measure.mjs <url> <selectors.json> <out-name> [viewports] [--live]
//     selectors.json : { "name": "css selector", ... }  (first match is measured)
//     viewports      : comma list of WxH, default = the AGENTS.md set
//     --live         : apply live-site prep (no promo banner, dismiss cookies,
//                      wait for the hero intro to finish)
// Output: .measure/<out-name>.json   { "<W>x<H>": { vars, items: { name: {...} } } }
// Diff two outputs with tools/diff.mjs.

import { chromium } from 'playwright-core'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const live = args.includes('--live')
const [url, selFile, outName, vpArg] = args.filter((a) => !a.startsWith('--'))
const selectors = JSON.parse(readFileSync(selFile, 'utf8'))
const DEFAULT_VPS = '375x812,768x1024,1024x768,1440x900,1920x1080,2560x1440,812x375'
const viewports = (vpArg || DEFAULT_VPS).split(',').map((s) => s.split('x').map(Number))

const launchOpts = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }
const browser = await chromium.launch({ headless: true, ...launchOpts })
const result = {}

const PROPS = [
  'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'color',
  'backgroundColor', 'borderRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'gap', 'opacity', 'visibility', 'objectFit', 'objectPosition', 'textShadow', 'zIndex', 'position',
  'width', 'height', 'display', 'filter',
]

for (const [w, h] of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    locale: 'en-US',
    isMobile: w < 900 && h !== 768 && w !== 1024 ? true : false,
    hasTouch: w < 900,
    deviceScaleFactor: 1,
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  })
  const page = await ctx.newPage()
  if (live) {
    await page.addInitStyleTag?.({ content: '' })
    await page.addInitScript(() => {
      const css = `:root{--_1qwkqln0:0 !important} ._1bkvte7{display:none !important} #onetrust-consent-sdk{display:none !important}`
      const add = () => {
        const s = document.createElement('style')
        s.textContent = css
        document.documentElement.appendChild(s)
      }
      if (document.documentElement) add()
      else document.addEventListener('DOMContentLoaded', add)
    })
  }
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
  if (live) {
    // wait until the intro has finished: navbar faded in, then the poster box
    // stops moving for 1.5s
    await page
      .waitForFunction(() => {
        const el = document.querySelector('nav._12q75i51')
        return el && getComputedStyle(el).opacity === '1'
      }, null, { timeout: 60000 })
      .catch(() => console.warn(`[${w}x${h}] navbar never faded in`))
    await page
      .waitForFunction(() => {
        const el = document.querySelector('._191jtbm3')
        if (!el) return false
        const r = el.getBoundingClientRect()
        const key = [r.x, r.y, r.width, r.height].map((n) => n.toFixed(1)).join()
        const now = performance.now()
        if (window.__mKey !== key) { window.__mKey = key; window.__mT = now; return false }
        return now - window.__mT > 1500
      }, null, { timeout: 30000, polling: 100 })
      .catch(() => console.warn(`[${w}x${h}] poster never settled`))
  } else {
    await page.waitForTimeout(800)
  }

  const data = await page.evaluate(
    ({ selectors, PROPS }) => {
      const root = getComputedStyle(document.documentElement)
      const body = getComputedStyle(document.body)
      const vars = {}
      for (const v of ['--jhqn1x0', '--jhqn1x1', '--jhqn1x3', '--promo-banner-height', '--_1uw8doi2', '--_1uw8doi3', '--u']) {
        vars[v] = (body.getPropertyValue(v) || root.getPropertyValue(v)).trim()
      }
      // resolve one scale unit to px
      const probe = document.createElement('div')
      probe.style.cssText = 'position:absolute;width:var(--jhqn1x3, var(--u, 0px));height:0'
      document.body.appendChild(probe)
      vars.unitPx = probe.getBoundingClientRect().width
      probe.remove()
      vars.bodyBg = body.backgroundColor
      const items = {}
      for (const [name, sel] of Object.entries(selectors)) {
        // first match that is actually laid out (some layouts keep hidden duplicates)
        const all = [...document.querySelectorAll(sel)]
        const el = all.find((e) => e.getBoundingClientRect().width > 0) || all[0]
        if (!el) { items[name] = null; continue }
        const r = el.getBoundingClientRect()
        const s = getComputedStyle(el)
        const o = { x: +r.x.toFixed(1), y: +(r.y + scrollY).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }
        for (const p of PROPS) o[p] = s[p]
        if (el.tagName === 'IMG') o.natural = `${el.naturalWidth}x${el.naturalHeight}`
        items[name] = o
      }
      return { vars, items }
    },
    { selectors, PROPS },
  )
  mkdirSync('.measure/shots', { recursive: true })
  await page.screenshot({ path: `.measure/shots/${outName}-${w}x${h}.png` })
  result[`${w}x${h}`] = data
  console.log(`${w}x${h} unit=${data.vars.unitPx}px`)
  await ctx.close()
}

mkdirSync('.measure', { recursive: true })
writeFileSync(`.measure/${outName}.json`, JSON.stringify(result, null, 2))
console.log('->', `.measure/${outName}.json`)
await browser.close()

// Scroll the live page in steps and report nav state + scroll-hint state.
// Usage: node tools/probe-scroll.mjs <url> <W>x<H> [steps=0,100,300,600,900,1500,3000] [--mobile]
import { chromium } from 'playwright-core'
const args = process.argv.slice(2)
const [url, vp = '1440x900', stepsArg] = args.filter((a) => !a.startsWith('--'))
const mobile = args.includes('--mobile')
const [w, h] = vp.split('x').map(Number)
const steps = (stepsArg || '0,100,300,600,900,1500,3000').split(',').map(Number)
const b = await chromium.launch({ channel: 'chrome' })
const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'en-US', isMobile: mobile, hasTouch: mobile })
const p = await ctx.newPage()
await p.addInitScript(() => {
  const add = () => { const s = document.createElement('style'); s.textContent = ':root{--_1qwkqln0:0 !important}._1bkvte7{display:none!important}#onetrust-consent-sdk{display:none!important}'; document.documentElement.appendChild(s) }
  document.documentElement ? add() : document.addEventListener('DOMContentLoaded', add)
})
await p.goto(url, { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForFunction(() => getComputedStyle(document.querySelector('nav._12q75i51')).opacity === '1', null, { timeout: 60000 }).catch(() => {})
await p.waitForTimeout(2500)
let first = true
for (const y of steps) {
  await p.evaluate((y) => window.scrollTo(0, y), y)
  if (!first) { await p.mouse.wheel(0, 1); await p.mouse.wheel(0, -1) }
  first = false
  await p.waitForTimeout(1500)
  const info = await p.evaluate(() => {
    const nav = document.querySelector('nav._12q75i51')
    const after = getComputedStyle(nav, '::after')
    const hint = document.querySelector('._1ph7wmg0')
    const svg = hint?.querySelector('svg')
    const hs = hint && getComputedStyle(hint)
    const ss = svg && getComputedStyle(svg)
    const r = svg?.getBoundingClientRect()
    const hr = hint?.getBoundingClientRect()
    const pill = document.querySelector('nav ._12q75i511')
    return {
      scrollY: Math.round(scrollY),
      navClass: nav.className,
      navAfter: after.content === 'none' ? 'none' : `${after.background.slice(0, 120)} h=${after.height}`,
      navTransform: getComputedStyle(nav).transform, navOp: getComputedStyle(nav).opacity,
      pill: pill && `${pill.className} op=${getComputedStyle(pill).opacity} vis=${getComputedStyle(pill).visibility}`,
      hint: hint && `class=${hint.className} box=[${hr.x.toFixed(1)},${hr.y.toFixed(1)} ${hr.width.toFixed(1)}x${hr.height.toFixed(1)}] op=${hs.opacity} vis=${hs.visibility} z=${hs.zIndex} pad=${hs.padding}`,
      svg: svg && `box=[${r.x.toFixed(1)},${r.y.toFixed(1)} ${r.width.toFixed(1)}x${r.height.toFixed(1)}] op=${ss.opacity} color=${ss.color} tf=${ss.transform} anim=${ss.animationName} class=${svg.getAttribute('class')} viewBox=${svg.getAttribute('viewBox')} attrs=${svg.getAttribute('width')}x${svg.getAttribute('height')}`,
      path: svg && [...svg.querySelectorAll('path')].map((pa) => { const c = getComputedStyle(pa); return `fill=${c.fill} stroke=${c.stroke} sw=${c.strokeWidth} cap=${c.strokeLinecap} join=${c.strokeLinejoin} len=${pa.getAttribute('d').length}` }).join(' ; '),
      label: hint?.textContent.trim(),
      hintParentTag: hint?.parentElement?.className,
    }
  })
  console.log(JSON.stringify(info))
}
await b.close()

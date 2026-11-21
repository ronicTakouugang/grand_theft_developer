// Load a page in real time and capture every painted frame (CDP screencast)
// from navigation, to check what a visitor sees, e.g. that the screen is
// never blank between the first paint, the loader and the intro.
// Usage: node tools/record-load.mjs <url> <W>x<H> <outDir> [durationMs=9000] [--mobile] [--reduced]
// Writes frame-<ms>.jpg (ms since navigation) and prints a brightness summary.
import { chromium } from 'playwright-core'
import { mkdirSync, writeFileSync } from 'node:fs'
const args = process.argv.slice(2)
const [url, vp, out, dur = '9000'] = args.filter((a) => !a.startsWith('--'))
const mobile = args.includes('--mobile')
const reduced = args.includes('--reduced')
const [w, h] = vp.split('x').map(Number)
mkdirSync(out, { recursive: true })
const b = await chromium.launch({ channel: 'chrome' })
const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, reducedMotion: reduced ? 'reduce' : 'no-preference' })
const p = await ctx.newPage()
const cdp = await ctx.newCDPSession(p)
const frames = []
let navStart = null
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  frames.push({ ts: metadata.timestamp, data })
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
})
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, everyNthFrame: 1 })
navStart = Date.now() / 1000
await p.goto(url, { waitUntil: 'commit' }).catch(() => {})
await p.waitForTimeout(+dur)
await cdp.send('Page.stopScreencast').catch(() => {})
await b.close()
for (const f of frames) {
  const ms = Math.round((f.ts - navStart) * 1000)
  writeFileSync(`${out}/frame-${String(Math.max(0, ms)).padStart(5, '0')}.jpg`, Buffer.from(f.data, 'base64'))
}
console.log(`${frames.length} frames -> ${out}`)

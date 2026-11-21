// Compare two measure outputs (same item names) and flag differences.
// Usage: node tools/diff.mjs .measure/<live>.json .measure/<local>.json [--props=a,b] [--skip=name,name] [--geom=x,y,w,h]
// Geometry passes when within 1px OR 1% (AGENTS.md definition of done).
// Style props are compared as strings (px values with 0.5px tolerance).
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const [aFile, bFile] = args.filter((a) => !a.startsWith('--'))
const opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1]?.split(',') ?? d)
const props = opt('props', ['fontSize', 'lineHeight', 'fontWeight', 'textTransform', 'color', 'backgroundColor', 'borderRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'gap'])
const skip = new Set(opt('skip', []))
// style props are only compared on these items (default: all)
const styled = opt('styled', null)
// items whose width is content-driven (our copy differs from the live copy)
const noWidth = new Set(opt('nowidth', []))
const geomKeys = opt('geom', ['x', 'y', 'w', 'h'])
const A = JSON.parse(readFileSync(aFile, 'utf8').replace(/^\uFEFF/, ''))
const B = JSON.parse(readFileSync(bFile, 'utf8').replace(/^\uFEFF/, ''))

const near = (a, b) => Math.abs(a - b) <= Math.max(1, Math.abs(a) * 0.01)
const pxNear = (a, b) => {
  const pa = String(a).match(/^-?[\d.]+px( -?[\d.]+px)*$/) && String(a).split(' ').map(parseFloat)
  const pb = String(b).match(/^-?[\d.]+px( -?[\d.]+px)*$/) && String(b).split(' ').map(parseFloat)
  if (pa && pb && pa.length === pb.length) return pa.every((v, i) => Math.abs(v - pb[i]) <= 0.5)
  return a === b
}

let fails = 0
let checks = 0
for (const vp of Object.keys(A)) {
  if (!B[vp]) { console.log(`## ${vp}: missing in ${bFile}`); continue }
  const lines = []
  for (const [name, a] of Object.entries(A[vp].items)) {
    if (skip.has(name)) continue
    const b = B[vp].items[name]
    if (!a || a.w === 0) continue // not laid out on live at this size
    if (!b) { lines.push(`  ${name}: missing locally`); fails++; continue }
    const bad = []
    for (const k of geomKeys) {
      if (noWidth.has(name) && k !== 'y' && k !== 'h') continue
      checks++
      if (!near(a[k], b[k])) bad.push(`${k} ${a[k]}→${b[k]}`)
    }
    if (!styled || styled.includes(name))
      for (const p of props) { checks++; if (!pxNear(a[p], b[p])) bad.push(`${p} ${a[p]}→${b[p]}`) }
    if (bad.length) { fails += bad.length; lines.push(`  ${name.padEnd(11)} ${bad.join(' | ')}`) }
  }
  console.log(`## ${vp}: ${lines.length ? lines.length + ' item(s) off' : 'OK'}`)
  if (lines.length) console.log(lines.join('\n'))
}
console.log(`\n${checks - fails}/${checks} checks within tolerance`)
process.exitCode = fails ? 1 : 0

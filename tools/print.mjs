// Pretty-print a measure JSON: node tools/print.mjs .measure/<name>.json [itemFilterRegex]
import { readFileSync } from 'node:fs'
const [file, filt] = process.argv.slice(2)
const d = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
const re = filt ? new RegExp(filt) : null
for (const [vp, v] of Object.entries(d)) {
  console.log(`\n## ${vp} unit=${v.vars.unitPx} bg=${v.vars.bodyBg}`)
  for (const [n, o] of Object.entries(v.items)) {
    if (re && !re.test(n)) continue
    if (!o) { console.log(n.padEnd(11), 'MISSING'); continue }
    const t = (o.fontFamily || '').split(',')[0].replace(/"/g, '')
    console.log(n.padEnd(11), `[${o.x},${o.y} ${o.w}x${o.h}]`, `${t} ${o.fontSize}/${o.lineHeight} w${o.fontWeight} ls${o.letterSpacing} ${o.textTransform}`, 'c=' + o.color,
      o.backgroundColor !== 'rgba(0, 0, 0, 0)' ? 'bg=' + o.backgroundColor : '', o.borderRadius !== '0px' ? 'br=' + o.borderRadius : '',
      'pad=' + [o.paddingTop, o.paddingRight, o.paddingBottom, o.paddingLeft].join(' '), o.gap !== 'normal' ? 'gap=' + o.gap : '', 'op=' + o.opacity, o.visibility === 'visible' ? '' : o.visibility)
  }
}

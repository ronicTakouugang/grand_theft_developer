// Compare two intro traces (tools/trace-intro.mjs) on a common time grid.
// Usage: node tools/compare-trace.mjs .measure/<a>.json .measure/<b>.json [from=-0.2] [to=5] [step=0.1]
// Prints each element's opacity (op) and scale (sc) a→b per time step, and the
// max difference per element. Missing elements count as opacity 0.
import { readFileSync } from 'node:fs'
const [aF, bF, from = '-0.2', to = '5', step = '0.1'] = process.argv.slice(2)
const A = JSON.parse(readFileSync(aF, 'utf8').replace(/^\uFEFF/, '')).samples.filter((s) => s.t != null)
const B = JSON.parse(readFileSync(bF, 'utf8').replace(/^\uFEFF/, '')).samples.filter((s) => s.t != null)
const keys = Object.keys(A[0]).filter((k) => k !== 't' && k in B[0])
// linear interpolation between the two frames around t
const at = (S, t, k, f) => {
  let i = S.findIndex((s) => s.t >= t)
  if (i <= 0) i = Math.max(1, i === -1 ? S.length - 1 : 1)
  const a = S[i - 1], b = S[i]
  const va = a[k] ? a[k][f] : f === 'op' ? 0 : 1
  const vb = b[k] ? b[k][f] : f === 'op' ? 0 : 1
  const u = b.t === a.t ? 0 : Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)))
  return va + (vb - va) * u
}
const maxd = Object.fromEntries(keys.map((k) => [k, { op: 0, sc: 0, opAt: 0, scAt: 0 }]))
console.log('t     ' + keys.map((k) => k.padEnd(19)).join(''))
for (let t = +from; t <= +to + 1e-9; t += +step) {
  const cells = keys.map((k) => {
    const ao = at(A, t, k, 'op'), bo = at(B, t, k, 'op'), as = at(A, t, k, 'sc'), bs = at(B, t, k, 'sc')
    if (Math.abs(ao - bo) > maxd[k].op) Object.assign(maxd[k], { op: Math.abs(ao - bo), opAt: t })
    if (Math.abs(as - bs) > maxd[k].sc) Object.assign(maxd[k], { sc: Math.abs(as - bs), scAt: t })
    const sc = Math.abs(as - 1) > 1e-3 || Math.abs(bs - 1) > 1e-3 ? ` s${as.toFixed(2)}/${bs.toFixed(2)}` : ''
    return `${ao.toFixed(2)}/${bo.toFixed(2)}${sc}`.padEnd(19)
  })
  console.log(t.toFixed(2).padEnd(6) + cells.join(''))
}
console.log('\nmax |live - ours|:')
for (const k of keys) console.log(`  ${k.padEnd(11)} opacity ${maxd[k].op.toFixed(3)} @${maxd[k].opAt.toFixed(1)}s   scale ${maxd[k].sc.toFixed(3)} @${maxd[k].scAt.toFixed(1)}s`)

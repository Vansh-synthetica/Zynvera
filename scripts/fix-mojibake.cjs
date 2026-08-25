/**
 * Fixes double-encoded UTF-8 (mojibake) caused by PowerShell re-encoding.
 * Reverses latin1-read-as-utf8 damage: utf8-bytes → latin1-read → re-encoded.
 * Only writes files where the repair measurably reduces corruption.
 */
const fs = require('fs')
const path = require('path')

const ROOTS = ['app', 'components', 'lib']
const EXTS = new Set(['.tsx', '.ts'])

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next') continue
      walk(p, out)
    } else if (EXTS.has(path.extname(e.name))) out.push(p)
  }
  return out
}

const corruptionScore = (s) => (s.match(/\uFFFD/g) || []).length

// Signs the file contains double-encoded bytes.
const looksDamaged = (s) =>
  /[\u00C3\u00C2\u00E5\u0080]/.test(s) || // Ã Â å €-style leaders
  /\uFFFD/.test(s) ||                      // replacement chars
  /dY[",'\u00E0\u017E]/.test(s)            // mangled emoji leads (ðŸ pattern)

let fixed = 0, checked = 0
for (const root of ROOTS) {
  if (!fs.existsSync(root)) continue
  for (const file of walk(root)) {
    checked++
    const original = fs.readFileSync(file, 'utf8')
    if (!looksDamaged(original)) continue

    const repaired = Buffer.from(original, 'latin1').toString('utf8')

    // Safety: repair must reduce corruption and keep the file plausible.
    const before = corruptionScore(original)
    const after = corruptionScore(repaired)
    const plausible = /export default|function |const |from '/.test(repaired)
    if (after < before && plausible) {
      fs.writeFileSync(file, repaired, 'utf8')
      fixed++
      console.log('fixed:', path.relative(process.cwd(), file))
    }
  }
}
console.log(`\nchecked ${checked} files, repaired ${fixed}`)

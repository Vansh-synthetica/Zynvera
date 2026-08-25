/**
 * Repairs CP1252 double-encoded UTF-8 across source files.
 * e.g. ðŸŽ" (U+00F0 U+0178 U+201C U+0161) -> 🎓
 * Also strips UTF-8 BOMs left by PowerShell.
 */
const fs = require('fs')
const path = require('path')

// CP1252 specials (0x80–0x9F) → their Unicode codepoints.
const CP1252 = {
  0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026,
  0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160,
  0x8B: 0x2039, 0x8C: 0x0152, 0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019,
  0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153,
  0x9E: 0x017E, 0x9F: 0x0178,
}
// Reverse map: Unicode codepoint -> CP1252 byte.
const TO_BYTE = new Map()
for (let b = 0xA0; b <= 0xFF; b++) TO_BYTE.set(b, b)
for (const [byte, cp] of Object.entries(CP1252)) TO_BYTE.set(cp, Number(byte))

const dec = new TextDecoder('utf8', { fatal: true })

function repair(s) {
  let out = ''
  let i = 0
  let changed = false
  while (i < s.length) {
    const cp = s.codePointAt(i)
    const b = TO_BYTE.get(cp)
    if (b !== undefined && b >= 0x80) {
      // Collect the run of high bytes.
      let j = i
      const bytes = []
      while (j < s.length) {
        const b2 = TO_BYTE.get(s.codePointAt(j))
        if (b2 === undefined || b2 < 0x80) break
        bytes.push(b2)
        j++
      }
      if (bytes.length >= 2) {
        // Longest valid UTF-8 decode wins.
        let replaced = null
        for (let end = bytes.length; end >= 2; end--) {
          try {
            replaced = dec.decode(Buffer.from(bytes.slice(0, end)))
            var consumed = end
            break
          } catch { /* try shorter */ }
        }
        if (replaced !== null) {
          out += replaced
          changed = true
          i += consumed
          continue
        }
      }
      out += s[i]
      i++
    } else {
      out += s[i]
      i++
    }
  }
  return { out, changed }
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next') continue
      walk(p, out)
    } else if (/\.(tsx?|css|json|md)$/.test(e.name)) out.push(p)
  }
  return out
}

let fixed = 0
const files = [...walk('app'), ...walk('components'), ...walk('lib')]
for (const file of files) {
  let c = fs.readFileSync(file, 'utf8')
  let touched = false

  if (c.charCodeAt(0) === 0xFEFF) {
    c = c.slice(1)
    touched = true
  }

  const { out, changed } = repair(c)
  if (changed) { c = out; touched = true }

  if (touched) {
    fs.writeFileSync(file, c, 'utf8')
    fixed++
    console.log('repaired:', path.relative(process.cwd(), file))
  }
}
console.log(`\nrepaired ${fixed} files`)

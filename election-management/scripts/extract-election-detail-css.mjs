import fs from 'fs'

const html = fs.readFileSync('election-detail.html', 'utf8')
const m = html.match(/<style>([\s\S]*?)<\/style>/)
if (!m) throw new Error('no style block')
let css = m[1]
const start = css.indexOf('/* ═══════════════════════════════════════\n   1. ELECTION HEADER')
css = css.slice(start)
css = css.replace(/\.content\{padding:20px 16px 40px;\}/g, '')

function mapVars(s) {
  return s
    .replace(/var\(--navy2\)/g, 'var(--ced-navy2)')
    .replace(/var\(--navy\)/g, 'var(--ced-navy)')
    .replace(/var\(--blue\)/g, 'var(--ced-blue)')
    .replace(/var\(--purple\)/g, 'var(--ced-purple)')
    .replace(/var\(--cyan\)/g, 'var(--ced-cyan)')
    .replace(/var\(--success\)/g, 'var(--ced-success)')
    .replace(/var\(--danger\)/g, 'var(--ced-danger)')
    .replace(/var\(--warning\)/g, 'var(--ced-warning)')
    .replace(/var\(--text\)/g, 'var(--ced-text)')
    .replace(/var\(--muted\)/g, 'var(--ced-muted)')
    .replace(/var\(--subtle\)/g, 'var(--ced-subtle)')
    .replace(/var\(--border\)/g, 'var(--ced-border)')
    .replace(/var\(--bg\)/g, 'var(--ced-bg)')
}

css = mapVars(css)
css = css.replace(/\/\*[\s\S]*?\*\//g, '')

function findMatchingBrace(str, openIdx) {
  let depth = 0
  for (let i = openIdx; i < str.length; i++) {
    if (str[i] === '{') depth++
    else if (str[i] === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return str.length - 1
}

function prefixCss(s, prefix) {
  s = s.trim()
  if (!s) return ''

  if (s.startsWith('@')) {
    const open = s.indexOf('{')
    const close = findMatchingBrace(s, open)
    const head = s.slice(0, open + 1)
    const inner = s.slice(open + 1, close)
    const tail = s.slice(close + 1)
    if (head.trim().startsWith('@media')) {
      return head + prefixCss(inner, prefix) + '}' + prefixCss(tail, prefix)
    }
    return s.slice(0, close + 1) + prefixCss(tail, prefix)
  }

  const open = s.indexOf('{')
  if (open === -1) return s
  const close = findMatchingBrace(s, open)
  const selector = s.slice(0, open).trim()
  const body = s.slice(open, close + 1)
  const tail = s.slice(close + 1)
  const prefixed = selector
    .split(',')
    .map((part) => {
      part = part.trim()
      if (!part || part.startsWith(prefix)) return part
      return `${prefix} ${part}`
    })
    .join(', ')
  return prefixed + body + prefixCss(tail, prefix)
}

const vars = `:root {
  --ced-navy: #0f2347;
  --ced-navy2: #1b3a6b;
  --ced-blue: #2451a3;
  --ced-purple: #6c3fc5;
  --ced-cyan: #06b6d4;
  --ced-success: #10b981;
  --ced-danger: #ef4444;
  --ced-warning: #f59e0b;
  --ced-text: #0f172a;
  --ced-muted: #475569;
  --ced-subtle: #94a3b8;
  --ced-border: #e2e8f0;
  --ced-bg: #f0f4f9;
}
`

const prefixed = prefixCss(css, '.creator-election-detail')
const out =
  vars +
  prefixed +
  '\n.creator-election-detail { font-family: Sora, system-ui, sans-serif; }\n' +
  '.creator-election-detail .ced-embedded-panels .vs-panel { margin-bottom: 16px; }\n' +
  '.creator-election-detail .btn-edit { text-decoration: none; }\n' +
  '.creator-election-detail .btn-publish { text-decoration: none; }\n'

fs.writeFileSync('src/styles/creator-election-detail.css', out)
console.log('wrote', out.length, 'chars')

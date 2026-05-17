import fs from 'fs'

const html = fs.readFileSync('browse-elections.html', 'utf8')
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1]
const rootMatch = css.match(/:root\{([^}]+)\}/)
const vars = rootMatch ? rootMatch[1] : ''
let body = css
  .replace(/:root\{[^}]+\}/, '')
  .replace(/\*,\*::before,\*::after\{[^}]+\}/, '')
  .replace(/html\{[^}]+\}/, '')
  .replace(/body\{[^}]+\}/, '')

const parts = body.split(/\n(?=\/\*|\.|@)/)
let out = `/* Browse elections — from browse-elections.html */\n.be-root{${vars}
  font-family:'Sora',system-ui,sans-serif;
  background:var(--bg);
  color:var(--text);
  min-height:100vh;
}\n`

for (const part of parts) {
  const t = part.trim()
  if (!t) continue
  if (t.startsWith('@media')) {
    out += t.replace(/\n(\.)/g, '\n.be-root $1') + '\n'
  } else if (t.startsWith('@keyframes')) {
    out += t + '\n'
  } else {
    const idx = t.indexOf('{')
    if (idx === -1) continue
    const sel = t.slice(0, idx).trim()
    const rest = t.slice(idx)
    out += `.be-root ${sel} ${rest}\n`
  }
}

fs.writeFileSync('src/styles/browse-elections.css', out)
console.log('wrote', out.length)

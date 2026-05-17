import fs from 'fs'

const html = fs.readFileSync('voter-dashboard.html', 'utf8')
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1]
const rootMatch = css.match(/:root\{([^}]+)\}/)
const vars = rootMatch ? rootMatch[1] : ''
let body = css
  .replace(/:root\{[^}]+\}/, '')
  .replace(/\*,\*::before,\*::after\{[^}]+\}/, '')
  .replace(/html,body\{[^}]+\}/, '')

const parts = body.split(/\n(?=\/\*|\.|@)/)
let out = `/* Voter dashboard — from voter-dashboard.html */\n.voter-app{${vars}
  font-family:'Sora',system-ui,sans-serif;
  background:var(--bg);
  color:var(--text);
  height:100vh;
  overflow:hidden;
}\n`

for (const part of parts) {
  const t = part.trim()
  if (!t) continue
  if (t.startsWith('@media')) {
    out += t.replace(/\n(\.)/g, '\n.voter-app $1') + '\n'
  } else if (t.startsWith('@keyframes')) {
    out += t + '\n'
  } else {
    const idx = t.indexOf('{')
    if (idx === -1) continue
    const sel = t.slice(0, idx).trim()
    const rest = t.slice(idx)
    out += `.voter-app ${sel} ${rest}\n`
  }
}

fs.writeFileSync('src/styles/voter-dashboard.css', out)
console.log('wrote', out.length)

import fs from 'fs'

const html = fs.readFileSync('live-results.html', 'utf8')
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1]
const rootMatch = css.match(/:root\{([^}]+)\}/)
const vars = rootMatch ? rootMatch[1] : ''
let body = css
  .replace(/:root\{[^}]+\}/, '')
  .replace(/\*,\*::before,\*::after\{[^}]+\}/, '')
  .replace(/html\{[^}]+\}/, '')
  .replace(/body\{[^}]+\}/, '')

const parts = body.split(/\n(?=\/\*|\.|@)/)
let out = `/* Live results — from live-results.html */\n.lr-root{${vars}
  font-family:'Sora',system-ui,sans-serif;
  background:var(--bg);
  color:var(--text);
  min-height:100vh;
}\n`

for (const part of parts) {
  const t = part.trim()
  if (!t) continue
  if (t.startsWith('@media')) {
    out += t.replace(/([,{])\s*(\.)/g, '$1 .lr-root $2').replace(/\n(\.)/g, '\n.lr-root $1') + '\n'
  } else if (t.startsWith('@keyframes')) {
    out += t + '\n'
  } else {
    const idx = t.indexOf('{')
    if (idx === -1) continue
    const sel = t.slice(0, idx).trim()
    const rest = t.slice(idx)
    out += `.lr-root ${sel} ${rest}\n`
  }
}

out += `.lr-root a.ec-btn,.lr-root a.fb-join-btn,.lr-root a.ws-btn,.lr-root a.nav-btn,.lr-root a.nav-link,.lr-root a.nav-brand,.lr-root a.footer-link,.lr-root a.hero-breadcrumb a{text-decoration:none;}\n`
out += `.lr-root .page-btn:disabled{opacity:0.4;cursor:not-allowed;}\n`

fs.writeFileSync('src/styles/live-results.css', out)
console.log('wrote', out.length)

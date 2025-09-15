const fs = require('fs')
const path = require('path')

const file = path.resolve(process.cwd(), 'babel.config.js')
if (!fs.existsSync(file)) {
  console.error('Eroare: lipsește babel.config.js în rădăcina proiectului')
  process.exit(1)
}

const src = fs.readFileSync(file, 'utf8')

// 1) Nu trebuie să existe react-native-reanimated/plugin
if (src.includes('react-native-reanimated/plugin')) {
  console.error('Eroare: găsit react-native-reanimated/plugin în babel.config.js')
  process.exit(1)
}

// 2) Trebuie să existe plugins:[...] și ultimul plugin să fie react-native-worklets/plugin
const m = src.match(/plugins\s*:\s*\[(.*?)\]/s)
if (!m) {
  console.error('Eroare: nu am găsit array-ul plugins în babel.config.js')
  process.exit(1)
}

const plugins = Array.from(m[1].matchAll(/['"]([^'"]+)['"]/g)).map(x => x[1]).filter(Boolean)
if (plugins.length === 0) {
  console.error('Eroare: plugins este gol în babel.config.js')
  process.exit(1)
}

const last = plugins[plugins.length - 1]
if (last !== 'react-native-worklets/plugin') {
  console.error('Eroare: ultimul plugin trebuie să fie react-native-worklets/plugin')
  console.error('Plugins detectate:', plugins)
  process.exit(1)
}

console.log('OK: Babel trece verificarea. Ultimul plugin este react-native-worklets/plugin, fără reanimated/plugin')
process.exit(0)

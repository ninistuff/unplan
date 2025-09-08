const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'app', 'index.tsx');
let src = fs.readFileSync(file, 'utf8');

// Ensure i18n + auth imports
if (!src.includes("from \"../lib/i18n\"")) {
  src = src.replace(
    /import\s+\{\s*buildWeatherMessage\s*\}\s+from\s+"\.\.\/utils\/weatherMessage";?/,
    (m) => m + "\nimport { useAuth } from \"../lib/auth\";\nimport { t } from \"../lib/i18n\";"
  );
}

// Ensure lang variable in Home component
if (!src.includes("const lang = (user?.profile?.language")) {
  src = src.replace(
    /export\s+default\s+function\s+Home\s*\(\)\s*\{[\s\S]*?const\s+weekday\s*=\s*new\s+Date\(\)\.getDay\(\)\s*;/,
    (m) => m + "\n  const { user } = useAuth();\n  const lang = (user?.profile?.language ?? 'en') as 'en' | 'ro';"
  );
}

function replaceTextContent(line, newExpr) {
  const i = line.indexOf('>');
  const j = line.lastIndexOf('</Text>');
  if (i !== -1 && j !== -1 && j > i) {
    return line.slice(0, i + 1) + newExpr + line.slice(j);
  }
  return line;
}

let lines = src.split(/\r?\n/);
for (let idx = 0; idx < lines.length; idx++) {
  let line = lines[idx];
  const lower = line.toLowerCase();
  if (line.includes('<Text') && /prieten/i.test(line)) {
    line = replaceTextContent(line, `{t(lang,'home_friendsCount')}`);
  }
  if (line.includes('<Text') && /timp/i.test(line)) {
    line = replaceTextContent(line, `{t(lang,'home_time')}`);
  }
  if (line.includes('<Text') && /animal/i.test(line)) {
    line = replaceTextContent(line, `{t(lang,'home_pet')}`);
  }
  if (line.includes('<Text') && /preferin/i.test(line)) {
    line = replaceTextContent(line, `{t(lang,'home_prefs')}`);
  }
  if (line.includes('<Text') && /copil/i.test(line) && /fontWeight/.test(line)) {
    // Child age label heading
    line = replaceTextContent(line, `{t(lang,'home_childAge')}`);
  }
  if (line.includes('<Text') && /let/i.test(line) && /go/i.test(line)) {
    line = replaceTextContent(line, `{t(lang,'home_letsGo')}`);
  }
  if (line.includes('<Text') && /surprinde/i.test(line)) {
    line = replaceTextContent(line, `{t(lang,'home_surprise')}`);
  }
  // Chips and labels
  line = line.replace(/label=\"Expat\"/g, "label={t(lang,'home_expat')}");
  line = line.replace(/label=\"[^\"]*Dizabil[^\"]*\"/g, "label={t(lang,'home_disabilities')}");
  line = line.replace(/label=\"C[^\"]*ine\"/g, "label={t(lang,'home_dog')}");
  line = line.replace(/label=\"Pisic[^\"]*\"/g, "label={t(lang,'home_cat')}");
  line = line.replace(/label=\"[^\"]*Bunici[^\"]*\"/g, "label={t(lang,'home_grandparents')}");
  line = line.replace(/label=\"[^\"]*copil[^\"]*\"/g, "label={t(lang,'home_withChild')}");
  // Parents chip: label text contains 'rin' sequence in corrupted form; target exact 'P' occurrence
  line = line.replace(/label=\"P[^\"]*\"/g, (m) => m.includes('Bunici') ? m : m.includes('Pisic') ? m : m.includes('C') ? m : m.includes('Expat') ? m : m.includes('Dizabil') ? m : "label={t(lang,'home_parents')}" );

  lines[idx] = line;
}

// Replace the dynamic childAge summary line
for (let idx = 0; idx < lines.length; idx++) {
  if (lines[idx].includes('childAge === 0') && lines[idx].includes('copii')) {
    const i = lines[idx].indexOf('<Text');
    const j = lines[idx].lastIndexOf('</Text>');
    const prefix = i !== -1 ? lines[idx].slice(0, i) : '';
    const open = i !== -1 ? lines[idx].slice(i, lines[idx].indexOf('>', i) + 1) : '<Text>';
    const close = j !== -1 ? lines[idx].slice(j) : '</Text>';
    lines[idx] = prefix + open + `{childAge === 0 ? t(lang,'home_noChild') : (childAge + ' ' + t(lang,'home_years'))}` + close;
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('index.tsx updated');

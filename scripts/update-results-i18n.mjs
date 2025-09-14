import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = dirname(__dirname) + '/app/results.tsx';
let src = fs.readFileSync(file, 'utf8');

// Ensure import t exists (already added earlier, but keep idempotent)
if (!src.includes("from \"../lib/i18n\"")) {
  src = src.replace(
    /import\s+\{\s*useAuth\s*\}\s+from\s+\"\.\.\/lib\/auth\";?/,
    (m) => m + "\nimport { t } from \"../lib/i18n\";"
  );
}

// Add lang/units if missing
if (!src.includes("const lang = (user?.profile?.language")) {
  src = src.replace(
    /const\s+\{\s*user\s*\}\s*=\s*useAuth\(\)\s*;?/,
    (m) => m + "\n  const lang = (user?.profile?.language ?? 'en') as 'en' | 'ro';\n  const units = (user?.profile?.units ?? 'metric') as 'metric' | 'imperial';"
  );
}

// Localize error + empty-state retry buttons
src = src.replace(/(onPress=\{load\}[\s\S]*?<Text[^>]*>)[\s\S]*?(<\/Text>)/g, (full, a, b) => `${a}{t(lang,'retry')}${b}`);

// Localize no-plans text
src = src.replace(/>\s*Nu am putut genera planuri momentan\.\s*</g, "> {t(lang,'noPlans')} <");

// Localize details button
src = src.replace(/>\s*Detalii\s*</g, "> {t(lang,'details')} <");

// Localize headings "Planuri pentru ~"
src = src.replace(/Planuri pentru ~\{formatHM\(options\.duration\)\}/g, "{t(lang,'plansFor')}{formatHM(options.duration)}");

// Add units-aware metaLine function OR replace existing
const replMeta = [
  "const metaLine = (p: Plan) => {",
  "    const distKm = typeof p.km === 'number' ? p.km : undefined;",
  "    const dist = distKm == null ? 'â€”' : (units === 'imperial' ? \`${Math.round(distKm*0.621371*10)/10} mi\` : \`${distKm} km\`);",
  "    const min = p.min == null ? 'â€”' : \`${p.min}\`;",
  "    const cost = typeof p.cost === 'number' ? \`${p.cost} lei\` : '0 lei';",
  "    return \`~${min} min â€¢ ${dist} â€¢ ${cost}\`;",
  "  };"
].join("\n");
src = src.replace(/const\s+metaLine\s*=\s*\([^)]*\)\s*=>\s*`[^`]*`;/, replMeta);

// Replace per-card meta template with metaLine(p)
// Try generic replacement for any backticked meta templates
src = src.replace(/\{\s*`~[\s\S]*?`\s*\}/g, '{metaLine(p)}');

// If metaLine wasn't replaced (due to encoding), inject a new helper and use it
if (!src.includes('units ===')) {
  src = src.replace(/const\s+metaLine[\s\S]*?;\s*/m, (m) => {
    return (
      m +
      "\nconst metaUnits = (p: Plan) => {\n" +
      "  const distKm = typeof p.km === 'number' ? p.km : undefined;\n" +
      "  const dist = distKm == null ? 'â€”' : (units === 'imperial' ? `${Math.round(distKm*0.621371*10)/10} mi` : `${distKm} km`);\n" +
      "  const min = p.min == null ? 'â€”' : `${p.min}`;\n" +
      "  const cost = typeof p.cost === 'number' ? `${p.cost} lei` : '0 lei';\n" +
      "  return `~${min} min â€¢ ${dist} â€¢ ${cost}`;\n" +
      "};\n"
    );
  });
  src = src.replace(/\{\s*`~[\s\S]*?`\s*\}/g, '{metaUnits(p)}');
}

fs.writeFileSync(file, src);
console.log('results.tsx updated');

// Ensure use metaUnits in card lines
src = src.replace(/\{\s*metaLine\(p\)\s*\}/g, '{metaUnits(p)}');
fs.writeFileSync(file, src);
console.log('results.tsx updated (pass3)');


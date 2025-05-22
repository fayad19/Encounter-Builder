import fs from 'fs';
import path from 'path';

const spellsPath = path.resolve('src/data/spells.json');
const outputDir = path.resolve('public/data');
const outputPath = path.join(outputDir, 'spell-summary.json');

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function generateSpellSummary() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const spellsRaw = fs.readFileSync(spellsPath, 'utf-8');
  const spells = JSON.parse(spellsRaw);
  const summary = spells.map((spell, idx) => ({
    name: spell.name,
    level: spell.level,
    traits: spell.traits,
    slug: slugify(spell.name),
    index: idx,
    type: spell.type,
    source: spell.source || '',
  }));
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`Wrote ${summary.length} spells to ${outputPath}`);
}

generateSpellSummary(); 
const fs = require('fs');
const path = require('path');

// Read the original JSON file
const spellSummaryPath = path.join(__dirname, '../data/spell-summary.json');
const spells = require(spellSummaryPath);

// Helper function to clean source text
function cleanSource(source) {
  if (!source) return '';
  // Remove PFS notes and clean up any special characters
  const mainSource = source.split('\\n')[0].split('\n')[0];
  return mainSource.trim();
}

// Process each spell
const cleanedSpells = spells.map(spell => ({
  ...spell,
  source: cleanSource(spell.source)
}));

// Write the cleaned JSON back to file
fs.writeFileSync(
  spellSummaryPath,
  JSON.stringify(cleanedSpells, null, 2),
  'utf8'
);

console.log('JSON file has been cleaned and reformatted.'); 
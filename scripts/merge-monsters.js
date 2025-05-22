import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to monsters directory and output file
const monstersDir = path.join(__dirname, '../src/data/monsters');
const outputFile = path.join(__dirname, '../src/data/all-monsters.json');

// Read all monster files
const monsterFiles = fs.readdirSync(monstersDir)
  .filter(file => file.endsWith('.json'))
  .map(file => path.join(monstersDir, file));

// Merge all monsters into one array
const allMonsters = monsterFiles.map(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const monster = JSON.parse(content);
    return monster;
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
    return null;
  }
}).filter(monster => monster !== null);

// Write the merged file
fs.writeFileSync(outputFile, JSON.stringify(allMonsters, null, 2));

console.log(`Successfully merged ${allMonsters.length} monsters into ${outputFile}`); 
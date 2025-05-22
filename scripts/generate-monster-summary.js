import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory containing monster JSON files
const monstersDir = path.join(__dirname, '../src/data/monsters');
const outputFile = path.join(__dirname, '../src/data/monster-summary.json');

// Function to process a single monster file
function processMonsterFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const monster = JSON.parse(content);
    
    // Extract required information from correct locations
    const summary = {
        name: monster.name,
        level: monster.system?.details?.level?.value ?? null,
        rarity: monster.system?.traits?.rarity ?? null,
        type: monster.system?.traits?.value ?? [],
        filename: path.basename(filePath)
    };
    
    return summary;
}

// Main function to process all monster files
function generateMonsterSummary() {
    const files = fs.readdirSync(monstersDir);
    const summaries = [];
    
    for (const file of files) {
        if (file.endsWith('.json')) {
            const filePath = path.join(monstersDir, file);
            try {
                const summary = processMonsterFile(filePath);
                summaries.push(summary);
            } catch (error) {
                console.error(`Error processing ${file}:`, error.message);
            }
        }
    }
    
    // Sort by name
    summaries.sort((a, b) => a.name.localeCompare(b.name));
    
    // Write to output file
    fs.writeFileSync(outputFile, JSON.stringify(summaries, null, 2));
    console.log(`Generated summary for ${summaries.length} monsters`);
}

generateMonsterSummary(); 
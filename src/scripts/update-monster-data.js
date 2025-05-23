import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name since __dirname is not available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the monster template
const template = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/monster-template.json'), 'utf8'));

// Read all monster files
const monstersDir = path.join(__dirname, '../data/monsters');
const allMonstersFile = path.join(__dirname, '../data/all-monsters.json');

// Read monster-summary.json to build a name-to-filename map
const monsterSummaryFile = path.join(__dirname, '../data/monster-summary.json');
let nameToFilename = {};
try {
  const monsterSummary = JSON.parse(fs.readFileSync(monsterSummaryFile, 'utf8'));
  nameToFilename = monsterSummary.reduce((acc, m) => {
    if (m.name && m.filename) acc[m.name] = m.filename;
    return acc;
  }, {});
} catch (e) {
  console.warn('Could not read monster-summary.json:', e);
}

// Function to process a single monster file
function processMonsterFile(filePath) {
    try {
        const monster = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Ensure system.attributes exists
        if (!monster.system) monster.system = {};
        if (!monster.system.attributes) monster.system.attributes = {};
        
        // Add new fields if they don't exist
        const attrs = monster.system.attributes;
        
        // Add conditionalEffects to AC if it has HP-based conditions
        if (attrs.ac && !attrs.ac.conditionalEffects) {
            attrs.ac.conditionalEffects = [];
        }
        
        // Add resistances array if it doesn't exist
        if (!attrs.resistances) {
            attrs.resistances = [];
        }
        
        // Add conditionalEffects array if it doesn't exist
        if (!attrs.conditionalEffects) {
            attrs.conditionalEffects = [];
        }
        
        // Add toggleableEffects array if it doesn't exist
        if (!attrs.toggleableEffects) {
            attrs.toggleableEffects = [];
        }
        
        // Process rules to find conditional effects
        if (monster.items) {
            monster.items.forEach(item => {
                if (item.system && item.system.rules) {
                    item.system.rules.forEach(rule => {
                        // Check for HP-based conditions
                        if (rule.predicate && rule.predicate.some(p => p['hp-percent'])) {
                            const condition = rule.predicate.find(p => p['hp-percent']);
                            if (condition) {
                                // Add to conditionalEffects
                                attrs.conditionalEffects.push({
                                    type: rule.key || 'unknown',
                                    value: rule.value || 0,
                                    conditions: {
                                        predicate: {
                                            [condition['hp-percent'].operator]: ['hp-percent', condition['hp-percent'].value]
                                        }
                                    }
                                });
                            }
                        }
                        
                        // Check for toggleable effects
                        if (rule.key === 'ToggleEffect') {
                            attrs.toggleableEffects.push({
                                name: rule.name || 'unknown',
                                label: rule.label || rule.name || 'unknown',
                                effects: rule.effects || []
                            });
                        }
                    });
                }
            });
        }
        
        return monster;
    } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
        return null;
    }
}

// Main function to update all monsters
async function updateAllMonsters() {
    try {
        // Read the all-monsters.json file
        const allMonsters = JSON.parse(fs.readFileSync(allMonstersFile, 'utf8'));
        
        // Process each monster
        const updatedMonsters = allMonsters.map(monster => {
            // If filename is missing, try to get it from the summary mapping
            let filename = monster.filename;
            if (!filename && monster.name && nameToFilename[monster.name]) {
                filename = nameToFilename[monster.name];
                monster.filename = filename; // Optionally add it for future use
            }
            if (!filename) {
                console.warn(`Monster ${monster.name} has no filename field and could not be found in summary`);
                return monster;
            }
            const monsterFile = path.join(monstersDir, filename);
            if (fs.existsSync(monsterFile)) {
                const updatedMonster = processMonsterFile(monsterFile);
                if (updatedMonster) {
                    return updatedMonster;
                }
            } else {
                console.warn(`Monster file not found: ${monsterFile}`);
            }
            return monster;
        }).filter(monster => monster !== null);
        
        // Write the updated monsters back to the file
        fs.writeFileSync(
            allMonstersFile,
            JSON.stringify(updatedMonsters, null, 2),
            'utf8'
        );
        
        console.log('Successfully updated monster data');
    } catch (error) {
        console.error('Error updating monster data:', error);
    }
}

// Run the update
updateAllMonsters(); 
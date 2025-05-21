import { openDB } from 'idb';

const DB_NAME = 'spellsDB';
const STORE_NAME = 'spells';
const DB_VERSION = 1;

// Mapping of old spell names to new remastered names
export const SPELL_NAME_MAPPING = {
  'Cone of Cold': 'Howling Blizzard',
  'Ray of Frost': 'Frostbite',
  'Acid Splash': 'Caustic Blast',
  'Chill Touch': 'Void Warp',
  'Ghost Sound': 'Figment',
  'Produce Flame': 'Ignition',
  'Tanglefoot': 'Tangle Vine',
  'Disrupt Undead': 'Vitality Lash',
  'Know Direction': 'Know the Way'
};

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      store.createIndex('name', 'name');
      store.createIndex('level', 'level');
    },
  });
}

// Helper function to get the remastered name
function getRemasteredName(oldName) {
  return SPELL_NAME_MAPPING[oldName] || oldName;
}

// Helper function to get the old name
function getOldName(newName) {
  for (const [oldName, remasteredName] of Object.entries(SPELL_NAME_MAPPING)) {
    if (remasteredName === newName) {
      return oldName;
    }
  }
  return null;
}

export async function isDatabasePopulated() {
  try {
    const db = await getDB();
    const count = await db.count(STORE_NAME);
    console.log('Current spell count in DB:', count);
    return count > 0;
  } catch (error) {
    console.error('Error checking if database is populated:', error);
    return false;
  }
}

export async function loadSpellsIntoDB() {
  try {
    console.log('Attempting to fetch spells.json...');
    const response = await fetch('/spells.json');
    
    if (!response.ok) {
      console.error('Fetch response not OK:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    console.log('Successfully fetched spells.json, parsing JSON...');
    const spells = await response.json();
    
    if (!Array.isArray(spells)) {
      console.error('Spells data is not an array:', typeof spells);
      throw new Error('Invalid spells data format');
    }

    // Log the first few spells to verify data structure
    console.log('First few spells from JSON:', spells.slice(0, 3));
    console.log('Available spell name mappings:', SPELL_NAME_MAPPING);
    
    // Check if Howling Blizzard exists in the JSON
    const howlingBlizzard = spells.find(s => s.name === 'Howling Blizzard');
    const coneOfCold = spells.find(s => s.name === 'Cone of Cold');
    console.log('Found Howling Blizzard:', howlingBlizzard);
    console.log('Found Cone of Cold:', coneOfCold);
    
    const db = await getDB();

    // Clear existing data first
    const clearTx = db.transaction(STORE_NAME, 'readwrite');
    await clearTx.objectStore(STORE_NAME).clear();
    await clearTx.done;
    console.log('Cleared existing database data');

    // Process spells in smaller batches
    const BATCH_SIZE = 20;
    let processedCount = 0;
    
    for (let i = 0; i < spells.length; i += BATCH_SIZE) {
      const batch = spells.slice(i, i + BATCH_SIZE);
      const batchTx = db.transaction(STORE_NAME, 'readwrite');
      const store = batchTx.objectStore(STORE_NAME);
      
      // Process each spell in the batch
      const batchPromises = batch.map(spell => {
        // Check if this is a remastered name
        const remasteredName = getRemasteredName(spell.name);
        const oldName = remasteredName !== spell.name ? spell.name : getOldName(spell.name);

        // Log spell being processed
        const spellInfo = {
          originalName: spell.name,
          remasteredName,
          oldName,
          isRemastered: remasteredName !== spell.name,
          level: spell.level,
          type: spell.type
        };
        console.log('Processing spell:', spellInfo);

        // Transform the spell data
        const transformedSpell = {
          id: `spell-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: remasteredName,
          oldName: oldName || spell.oldName || null,
          level: spell.level,
          type: spell.type,
          traditions: spell.traditions || [],
          traits: spell.traits || [],
          cast: spell.cast || '',
          components: spell.components || [],
          range: spell.range || '',
          area: spell.area || '',
          targets: spell.targets || '',
          duration: spell.duration || '',
          description: spell.description || ''
        };

        return store.put(transformedSpell);
      });

      // Wait for all spells in this batch to be stored
      await Promise.all(batchPromises);
      await batchTx.done;
      
      processedCount += batch.length;
      console.log(`Processed ${processedCount}/${spells.length} spells...`);
    }

    // Verify the database contents after loading
    const verifyTx = db.transaction(STORE_NAME, 'readonly');
    const allSpells = await verifyTx.objectStore(STORE_NAME).getAll();
    await verifyTx.done;
    
    console.log('Total spells in database:', allSpells.length);
    console.log('Verifying Howling Blizzard in database:', 
      allSpells.find(s => s.name === 'Howling Blizzard' || s.oldName === 'Howling Blizzard'));
    console.log('Verifying Cone of Cold in database:',
      allSpells.find(s => s.name === 'Cone of Cold' || s.oldName === 'Cone of Cold'));
    
    console.log('Successfully loaded all spells into database');
    return true;
  } catch (error) {
    console.error('Detailed error loading spells into DB:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
}

export async function searchSpells(searchTerm = '', levelFilter = '') {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    let spells = await store.getAll();
    await tx.done;
    
    console.log(`Retrieved ${spells.length} spells from database`);
    
    // Apply search filter
    if (searchTerm) {
      const terms = searchTerm.toLowerCase().trim().split(/\s+/);
      console.log('Searching for terms:', terms);
      console.log('Available spell name mappings:', SPELL_NAME_MAPPING);
      
      spells = spells.filter(spell => {
        // Get all searchable text for this spell
        const searchableText = [
          spell.name.toLowerCase(),
          spell.oldName ? spell.oldName.toLowerCase() : '',
          ...Object.entries(SPELL_NAME_MAPPING).flatMap(([oldName, newName]) => {
            if (oldName.toLowerCase() === spell.name.toLowerCase() || 
                newName.toLowerCase() === spell.name.toLowerCase()) {
              return [oldName.toLowerCase(), newName.toLowerCase()];
            }
            return [];
          })
        ].join(' ');

        // Log the searchable text for debugging
        console.log('Searchable text for spell:', {
          spellName: spell.name,
          searchableText,
          terms
        });

        // Check if all search terms match
        return terms.every(term => searchableText.includes(term));
      });
      
      // Log the final results
      console.log('Search results:', {
        searchTerms: terms,
        resultsCount: spells.length,
        results: spells.map(s => ({
          name: s.name,
          oldName: s.oldName,
          level: s.level,
          type: s.type
        }))
      });
    }
    
    // Apply level filter
    if (levelFilter !== '') {
      const level = parseInt(levelFilter);
      spells = spells.filter(spell => spell.level === level);
      console.log(`Found ${spells.length} spells matching level filter: ${levelFilter}`);
    }
    
    return spells;
  } catch (error) {
    console.error('Error searching spells:', error);
    throw error;
  }
}

export async function getSpellById(id) {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function getSpellBySlug(slug) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const spells = await store.getAll();
  
  return spells.find(spell => spell.name.toLowerCase().replace(/\s+/g, '-') === slug);
}

export async function clearDatabase() {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.objectStore(STORE_NAME).clear();
    await tx.done;
    console.log('Database cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing database:', error);
    return false;
  }
}
import { openDB } from 'idb';
import spellSummary from '../data/spell-summary.json';
import spells from '../data/spells.json';

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

export async function clearSpellDB() {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.store.clear();
    await tx.done;
    console.log('Database cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing database:', error);
    return false;
  }
}

export async function loadSpellsIntoDB() {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    
    for (const summarySpell of spellSummary) {
      // Get the full spell data using the index
      const fullSpell = spells[summarySpell.index];
      
      const transformedSpell = {
        id: `spell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...summarySpell,
        // Add full spell data
        description: fullSpell?.description || '',
        cast: fullSpell?.cast || '',
        range: fullSpell?.range || '',
        targets: fullSpell?.targets || '',
        area: fullSpell?.area || '',
        duration: fullSpell?.duration || '',
        saving_throw: fullSpell?.['saving throw'] || '',
        defense: fullSpell?.defense || '',
        traditions: fullSpell?.traditions || [],
        components: fullSpell?.components || []
      };
      await tx.store.put(transformedSpell);
    }
    
    await tx.done;
    console.log('Successfully loaded all spells into database');
    return true;
  } catch (error) {
    console.error('Error loading spells into DB:', error);
    return false;
  }
}

export async function searchSpells(searchTerm = '') {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    let spells = await store.getAll();
    await tx.done;
    
    if (searchTerm) {
      const terms = searchTerm.toLowerCase().trim().split(/\s+/);
      spells = spells.filter(spell => {
        const searchableText = [
          spell.name.toLowerCase(),
          spell.oldName ? spell.oldName.toLowerCase() : '',
          spell.description ? spell.description.toLowerCase() : ''
        ].join(' ');
        return terms.every(term => searchableText.includes(term));
      });
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
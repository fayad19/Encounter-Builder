import { openDB } from 'idb';

const DB_NAME = 'monster-database';
const STORE_NAME = 'monsters';
const DB_VERSION = 1;
const BATCH_SIZE = 50; // Process 50 monsters at a time

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create a store of objects
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: 'id'
      });
      // Create indexes for fast searching
      store.createIndex('name', 'name', { unique: false });
      store.createIndex('level', 'level', { unique: false });
    },
  });
}

async function processBatch(db, monsterBatch) {
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  for (const monster of monsterBatch) {
    await store.put(monster);
  }
  
  await tx.done;
}

export async function loadMonstersIntoDB() {
  const db = await initDB();
  const monsterFiles = import.meta.glob('../data/monsters/*.json');
  
  try {
    // Clear existing data
    const clearTx = db.transaction(STORE_NAME, 'readwrite');
    await clearTx.objectStore(STORE_NAME).clear();
    await clearTx.done;

    // Process monsters in batches
    let currentBatch = [];
    let processedCount = 0;
    const totalFiles = Object.keys(monsterFiles).length;

    for (const [path, importFn] of Object.entries(monsterFiles)) {
      try {
        const monster = await importFn();
        const processedMonster = {
          ...monster,
          level: monster.system.details.level.value,
          id: monster._id
        };
        
        currentBatch.push(processedMonster);
        
        // When batch is full or this is the last item, process the batch
        if (currentBatch.length >= BATCH_SIZE || processedCount === totalFiles - 1) {
          await processBatch(db, currentBatch);
          currentBatch = [];
        }
        
        processedCount++;
      } catch (error) {
        console.error(`Error loading monster from ${path}:`, error);
      }
    }

    // Process any remaining monsters
    if (currentBatch.length > 0) {
      await processBatch(db, currentBatch);
    }

    return db;
  } catch (error) {
    console.error('Error during database population:', error);
    throw error;
  }
}

export async function searchMonsters({ nameSearch = '', levelFilter = '' }) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  
  // Get all monsters
  let monsters = await store.getAll();
  
  // Apply filters
  if (nameSearch) {
    const searchLower = nameSearch.toLowerCase();
    monsters = monsters.filter(m => 
      m.name.toLowerCase().includes(searchLower)
    );
  }
  
  if (levelFilter !== '') {
    const level = parseInt(levelFilter);
    monsters = monsters.filter(m => m.level === level);
  }
  
  return monsters;
}

export async function isDatabasePopulated() {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const count = await store.count();
  return count > 0;
} 
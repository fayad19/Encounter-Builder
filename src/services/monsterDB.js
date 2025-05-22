import { openDB } from 'idb';
import allMonsters from '../data/all-monsters.json';

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
  
  try {
    console.log('Starting monster database population...');
    console.log(`Found ${allMonsters.length} monsters in the merged file`);
    
    // Clear existing data
    const clearTx = db.transaction(STORE_NAME, 'readwrite');
    await clearTx.objectStore(STORE_NAME).clear();
    await clearTx.done;
    console.log('Cleared existing database');

    // Process monsters in batches
    let currentBatch = [];
    let processedCount = 0;
    let errorCount = 0;
    const totalMonsters = allMonsters.length;

    for (const monster of allMonsters) {
      try {
        if (!monster || !monster.system) {
          console.warn(`Invalid monster data:`, monster);
          errorCount++;
          continue;
        }

        const processedMonster = {
          ...monster,
          level: monster.system.details.level.value,
          id: monster._id || `monster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        
        currentBatch.push(processedMonster);
        
        // When batch is full or this is the last item, process the batch
        if (currentBatch.length >= BATCH_SIZE || processedCount === totalMonsters - 1) {
          await processBatch(db, currentBatch);
          console.log(`Processed batch of ${currentBatch.length} monsters. Total: ${processedCount + 1}/${totalMonsters}`);
          currentBatch = [];
        }
        
        processedCount++;
      } catch (error) {
        console.error(`Error processing monster:`, error);
        errorCount++;
      }
    }

    // Process any remaining monsters
    if (currentBatch.length > 0) {
      await processBatch(db, currentBatch);
      console.log(`Processed final batch of ${currentBatch.length} monsters`);
    }

    // Verify the database contents
    const verifyTx = db.transaction(STORE_NAME, 'readonly');
    const totalMonstersInDB = await verifyTx.objectStore(STORE_NAME).count();
    await verifyTx.done;

    console.log('Database population complete:', {
      totalMonsters,
      processedCount,
      errorCount,
      totalMonstersInDB
    });

    if (errorCount > 0) {
      console.warn(`Completed with ${errorCount} errors`);
    }

    if (totalMonstersInDB !== totalMonsters) {
      console.warn(`Warning: Database count (${totalMonstersInDB}) doesn't match monster count (${totalMonsters})`);
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

export async function getDatabaseStats() {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  
  const totalMonsters = await store.count();
  const monsters = await store.getAll();
  
  // Get level distribution
  const levelDistribution = monsters.reduce((acc, monster) => {
    const level = monster.level;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});
  
  return {
    totalMonsters,
    levelDistribution,
    databaseName: DB_NAME,
    storeName: STORE_NAME,
    version: DB_VERSION
  };
} 
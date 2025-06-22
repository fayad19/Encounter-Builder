// Mock Encounter Service for testing without Firebase
// This simulates Firebase functionality using localStorage

export class MockEncounterService {
  static STORAGE_KEY = 'mock_encounters';
  static ENCOUNTER_PREFIX = 'encounter-';

  // Initialize mock storage
  static initStorage() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({}));
    }
  }

  // Get all mock encounters from localStorage
  static getMockEncounters() {
    this.initStorage();
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  // Save encounter data to mock storage
  static async saveEncounter(encounterId, data) {
    try {
      this.initStorage();
      const encounters = this.getMockEncounters();
      
      encounters[encounterId] = {
        ...data,
        updatedAt: new Date().toISOString(),
        version: '1.0',
        createdAt: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(encounters));
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true, id: encounterId };
    } catch (error) {
      console.error('Error saving encounter:', error);
      throw new Error('Failed to save encounter');
    }
  }

  // Load encounter data from mock storage
  static async loadEncounter(encounterId) {
    try {
      this.initStorage();
      const encounters = this.getMockEncounters();
      
      if (encounters[encounterId]) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        return encounters[encounterId];
      } else {
        throw new Error('Encounter not found');
      }
    } catch (error) {
      console.error('Error loading encounter:', error);
      throw error;
    }
  }

  // List recent encounters
  static async listRecentEncounters(limit = 10) {
    try {
      this.initStorage();
      const encounters = this.getMockEncounters();
      
      const sortedEncounters = Object.entries(encounters)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, limit);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return sortedEncounters;
    } catch (error) {
      console.error('Error listing encounters:', error);
      throw new Error('Failed to list encounters');
    }
  }

  // Delete encounter
  static async deleteEncounter(encounterId) {
    try {
      this.initStorage();
      const encounters = this.getMockEncounters();
      
      if (encounters[encounterId]) {
        delete encounters[encounterId];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(encounters));
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return { success: true };
      } else {
        throw new Error('Encounter not found');
      }
    } catch (error) {
      console.error('Error deleting encounter:', error);
      throw new Error('Failed to delete encounter');
    }
  }

  // Generate a unique encounter ID
  static generateEncounterId() {
    return `${this.ENCOUNTER_PREFIX}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Extract encounter ID from URL or string
  static extractEncounterId(input) {
    // Handle full URLs
    if (input.includes('?')) {
      const urlParams = new URLSearchParams(input.split('?')[1]);
      return urlParams.get('encounter');
    }
    // Handle just the ID
    return input.trim();
  }

  // Get all localStorage data as an object
  static getAllLocalStorageData() {
    const data = {};
    
    // Battle/Encounter data
    data.creatures = JSON.parse(localStorage.getItem('creatures') || '[]');
    data.battleCreatures = JSON.parse(localStorage.getItem('battleCreatures') || '[]');
    data.players = JSON.parse(localStorage.getItem('players') || '[]');
    data.battleParticipants = JSON.parse(localStorage.getItem('battleParticipants') || '[]');
    data.currentTurn = localStorage.getItem('currentTurn');
    data.battleStarted = localStorage.getItem('battleStarted');
    data.currentRound = localStorage.getItem('currentRound');
    
    // Spell bookmark data
    data.spellBookmarks = JSON.parse(localStorage.getItem('SpellDB_bookmarkLists') || '[]');
    data.activeBookmarkList = localStorage.getItem('SpellDB_activeList');
    
    // UI preferences
    data.darkMode = localStorage.getItem('SpellDB_darkMode');
    
    return data;
  }

  // Restore all localStorage data from object
  static restoreLocalStorageData(data) {
    try {
      // Restore battle/encounter data
      if (data.creatures) localStorage.setItem('creatures', JSON.stringify(data.creatures));
      if (data.battleCreatures) localStorage.setItem('battleCreatures', JSON.stringify(data.battleCreatures));
      if (data.players) localStorage.setItem('players', JSON.stringify(data.players));
      if (data.battleParticipants) localStorage.setItem('battleParticipants', JSON.stringify(data.battleParticipants));
      if (data.currentTurn) localStorage.setItem('currentTurn', data.currentTurn);
      if (data.battleStarted) localStorage.setItem('battleStarted', data.battleStarted);
      if (data.currentRound) localStorage.setItem('currentRound', data.currentRound);
      
      // Restore spell bookmark data
      if (data.spellBookmarks) localStorage.setItem('SpellDB_bookmarkLists', JSON.stringify(data.spellBookmarks));
      if (data.activeBookmarkList) localStorage.setItem('SpellDB_activeList', data.activeBookmarkList);
      
      // Restore UI preferences
      if (data.darkMode) localStorage.setItem('SpellDB_darkMode', data.darkMode);
      
      return true;
    } catch (error) {
      console.error('Error restoring localStorage data:', error);
      return false;
    }
  }

  // Get mock storage statistics
  static getStorageStats() {
    this.initStorage();
    const encounters = this.getMockEncounters();
    const count = Object.keys(encounters).length;
    
    return {
      totalEncounters: count,
      storageUsed: JSON.stringify(encounters).length,
      lastUpdated: count > 0 ? 
        new Date(Math.max(...Object.values(encounters).map(e => new Date(e.updatedAt)))) : 
        null
    };
  }

  // Clear all mock encounters
  static clearAllEncounters() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.initStorage();
  }
} 
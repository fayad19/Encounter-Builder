import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit, deleteDoc } from 'firebase/firestore';

export class EncounterService {
  // Save encounter data to Firebase
  static async saveEncounter(encounterId, data) {
    try {
      const encounterRef = doc(db, 'encounters', encounterId);
      await setDoc(encounterRef, {
        ...data,
        updatedAt: new Date(),
        version: '1.0',
        createdAt: new Date()
      });
      return { success: true, id: encounterId };
    } catch (error) {
      console.error('Error saving encounter:', error);
      throw new Error('Failed to save encounter');
    }
  }

  // Load encounter data from Firebase
  static async loadEncounter(encounterId) {
    try {
      const encounterRef = doc(db, 'encounters', encounterId);
      const docSnap = await getDoc(encounterRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        throw new Error('Encounter not found');
      }
    } catch (error) {
      console.error('Error loading encounter:', error);
      throw error;
    }
  }

  // List recent encounters (for admin purposes)
  static async listRecentEncounters(limit = 10) {
    try {
      const q = query(
        collection(db, 'encounters'),
        orderBy('updatedAt', 'desc'),
        limit(limit)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error listing encounters:', error);
      throw new Error('Failed to list encounters');
    }
  }

  // Delete encounter
  static async deleteEncounter(encounterId) {
    try {
      const encounterRef = doc(db, 'encounters', encounterId);
      await deleteDoc(encounterRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting encounter:', error);
      throw new Error('Failed to delete encounter');
    }
  }

  // Generate a unique encounter ID
  static generateEncounterId() {
    return `encounter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
} 
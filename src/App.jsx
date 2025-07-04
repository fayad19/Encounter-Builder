import React, { useState, useEffect, useRef } from 'react';
import { Container, Nav, Tab, Button, Modal, Alert, Image } from 'react-bootstrap';
import CreaturesTab from './components/CreaturesTab';
import BattleTab from './components/BattleTab';
import PlayersTab from './components/PlayersTab';
import BestiaryTab from './components/BestiaryTab';
import InitiativeDialog from './components/InitiativeDialog';
import fillip from './assets/fillip.mp3';
import fillipBg from './assets/fillip.jpg';
import kidMeme from './assets/kid-meme.gif';
import SpellsTab from './components/SpellsTab';
import EncounterSharing from './components/EncounterSharing';
import { loadMonstersIntoDB, isDatabasePopulated as isMonsterDBPopulated } from './services/monsterDB';
import { loadSpellsIntoDB, isDatabasePopulated as isSpellDBPopulated } from './services/spellDB';
import { calculateCurrentResistances } from './utils/creatureConversion';
import quickRefData from './data/quickRef.json';
import './styles/EncounterSharing.css';

function App() {
  const audioRef = useRef(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showStopConfirmModal, setShowStopConfirmModal] = useState(false);
  const [showFillipMessage, setShowFillipMessage] = useState(false);
  const [showKidMeme, setShowKidMeme] = useState(false);
  const [battleTabStyle, setBattleTabStyle] = useState({});
  const [showBattleContent, setShowBattleContent] = useState(true);

  // Initialize audio on component mount
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.loop = true;
    }
  }, []);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        setShowStopConfirmModal(true);
      } else {
        audioRef.current.play().catch(error => {
          console.log('Audio playback failed:', error);
        });
        setIsMusicPlaying(true);
        setShowKidMeme(true);
      }
    }
  };

  const handleStopConfirm = () => {
    setShowFillipMessage(true);
    setBattleTabStyle({
      backgroundImage: `url(${fillipBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      position: 'relative'
    });
    setShowBattleContent(false);
    setShowStopConfirmModal(false);
    setShowKidMeme(false);
  };

  const handleStopCancel = () => {
    setShowStopConfirmModal(false);
  };

  // Initialize state with localStorage values
  const [creatures, setCreatures] = useState(() => {
    try {
      const savedCreatures = localStorage.getItem('creatures');
      return savedCreatures ? JSON.parse(savedCreatures) : [];
    } catch (error) {
      console.error('Error loading creatures from localStorage:', error);
      return [];
    }
  });

  const [battleCreatures, setBattleCreatures] = useState(() => {
    try {
      const savedBattleCreatures = localStorage.getItem('battleCreatures');
      return savedBattleCreatures ? JSON.parse(savedBattleCreatures) : [];
    } catch (error) {
      console.error('Error loading battle creatures from localStorage:', error);
      return [];
    }
  });

  const [players, setPlayers] = useState(() => {
    try {
      const savedPlayers = localStorage.getItem('players');
      return savedPlayers ? JSON.parse(savedPlayers) : [];
    } catch (error) {
      console.error('Error loading players from localStorage:', error);
      return [];
    }
  });

  const [battleParticipants, setBattleParticipants] = useState(() => {
    try {
      const savedBattleParticipants = localStorage.getItem('battleParticipants');
      return savedBattleParticipants ? JSON.parse(savedBattleParticipants) : [];
    } catch (error) {
      console.error('Error loading battle participants from localStorage:', error);
      return [];
    }
  });

  const [currentTurn, setCurrentTurn] = useState(() => {
    try {
      const savedCurrentTurn = localStorage.getItem('currentTurn');
      return savedCurrentTurn || null;
    } catch (error) {
      console.error('Error loading current turn from localStorage:', error);
      return null;
    }
  });

  const [battleStarted, setBattleStarted] = useState(() => {
    try {
      const savedBattleStarted = localStorage.getItem('battleStarted');
      return savedBattleStarted === 'true';
    } catch (error) {
      console.error('Error loading battle started state from localStorage:', error);
      return false;
    }
  });

  const [currentRound, setCurrentRound] = useState(() => {
    try {
      const savedRound = localStorage.getItem('currentRound');
      return savedRound ? parseInt(savedRound) : 1;
    } catch (error) {
      console.error('Error loading current round from localStorage:', error);
      return 1;
    }
  });

  const [currentTab, setCurrentTab] = useState('battle');
  const [initiativeDialogOpen, setInitiativeDialogOpen] = useState(false);
  const [remainingParticipants, setRemainingParticipants] = useState([]);

  // Add state for initiative tie during start battle
  const [initiativeTie, setInitiativeTie] = useState(null);
  const [pendingInitiativeParticipant, setPendingInitiativeParticipant] = useState(null);

  // Add state for current initiative value
  const [currentInitiativeValue, setCurrentInitiativeValue] = useState(null);

  // Add state for last added initiative
  const [lastAddedInitiative, setLastAddedInitiative] = useState(null);

  // Add state for References tab
  const [referencesMenu, setReferencesMenu] = useState('Conditions');
  const [selectedReference, setSelectedReference] = useState(null);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('creatures', JSON.stringify(creatures));
    } catch (error) {
      console.error('Error saving creatures to localStorage:', error);
    }
  }, [creatures]);

  useEffect(() => {
    try {
      localStorage.setItem('battleCreatures', JSON.stringify(battleCreatures));
    } catch (error) {
      console.error('Error saving battle creatures to localStorage:', error);
    }
  }, [battleCreatures]);

  useEffect(() => {
    try {
      localStorage.setItem('players', JSON.stringify(players));
    } catch (error) {
      console.error('Error saving players to localStorage:', error);
    }
  }, [players]);

  useEffect(() => {
    try {
      localStorage.setItem('battleParticipants', JSON.stringify(battleParticipants));
    } catch (error) {
      console.error('Error saving battle participants to localStorage:', error);
    }
  }, [battleParticipants]);

  useEffect(() => {
    try {
      localStorage.setItem('currentTurn', currentTurn);
    } catch (error) {
      console.error('Error saving current turn to localStorage:', error);
    }
  }, [currentTurn]);

  useEffect(() => {
    try {
      localStorage.setItem('battleStarted', battleStarted);
    } catch (error) {
      console.error('Error saving battle started state to localStorage:', error);
    }
  }, [battleStarted]);

  useEffect(() => {
    try {
      localStorage.setItem('currentRound', currentRound);
    } catch (error) {
      console.error('Error saving current round to localStorage:', error);
    }
  }, [currentRound]);

  const handleTabChange = (key) => {
    setCurrentTab(key);
    if (key !== 'battle') {
      setShowBattleContent(true);
    }
  };

  const handleAddCreature = (creature) => {
    setCreatures([...creatures, { ...creature, id: Date.now() }]);
  };

  const handleAddCreatureToBattle = (creature) => {
    setBattleCreatures([...battleCreatures, { ...creature, id: Date.now() }]);
  };

  const handleRemoveCreature = (creatureId) => {
    setBattleCreatures(battleCreatures.filter(creature => creature.id !== creatureId));
  };

  const handleDeleteCreature = (creatureId) => {
    setCreatures(creatures.filter(creature => creature.id !== creatureId));
  };

  const handleUpdateCreature = (updatedCreature) => {
    // Update in creatures list
    setCreatures(creatures.map(creature => 
      creature.id === updatedCreature.id ? updatedCreature : creature
    ));
    
    // Update in battleCreatures list if it exists there
    setBattleCreatures(battleCreatures.map(creature => 
      creature.id === updatedCreature.id ? updatedCreature : creature
    ));
  };

  const handleAddPlayer = (player) => {
    setPlayers([...players, { ...player, id: Date.now() }]);
  };

  const handleDeletePlayer = (playerId) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const handleUpdatePlayer = (playerId, updatedData) => {
    setPlayers(players.map(player => 
      player.id === playerId ? { ...player, ...updatedData } : player
    ));
  };

  const handleStartBattle = () => {
    // Only use participants that are already in battleParticipants
    const allParticipants = battleParticipants.map(participant => ({
      ...participant,
      type: participant.type || (participant.hp ? 'creature' : 'player'),
      battleId: Date.now() + Math.random() // Ensure unique battleId for each participant
    }));
    
    console.log('Starting battle with participants:', allParticipants.map(p => ({ name: p.name, type: p.type })));
    
    if (allParticipants.length === 0) {
      alert('Please add at least one participant to start the battle.');
      return;
    }

    setBattleStarted(true);
    setCurrentRound(1);
    setCurrentTurn(null);
    
    // Clear battle participants and set remaining participants
    setBattleParticipants([]);
    setRemainingParticipants(allParticipants);
    setInitiativeDialogOpen(true);
  };

  const handleEndBattle = () => {
    setBattleStarted(false);
    setCurrentTurn(null);
    setBattleParticipants([]);
    setCurrentRound(1);
  };

  const handleInitiativeConfirm = (initiative) => {
    if (remainingParticipants.length === 0) {
      console.log('No remaining participants to confirm initiative for');
      return;
    }

    const currentParticipant = remainingParticipants[0];
    console.log('Confirming initiative for participant:', { name: currentParticipant.name, type: currentParticipant.type });
    console.log('Remaining participants:', remainingParticipants.map(p => ({ name: p.name, type: p.type })));
    
    const newInitiative = Number(initiative);
    // Always add the participant and set lastAddedInitiative
    const newParticipant = {
      ...currentParticipant,
      initiative: newInitiative,
      status: '',
      battleId: currentParticipant.battleId || Date.now(),
      type: currentParticipant.type || 'creature',
      hp: currentParticipant.hp || 0,
      id: currentParticipant.id,
      damageInput: '',
      maxHp: (currentParticipant.maxHp !== undefined && currentParticipant.maxHp !== '' && currentParticipant.maxHp !== null) ? Number(currentParticipant.maxHp) : (currentParticipant.hp || 0)
    };

    setBattleParticipants(prevParticipants => {
      const updatedParticipants = [...prevParticipants, newParticipant];
      console.log('Updated battle participants:', updatedParticipants.map(p => ({ name: p.name, type: p.type, initiative: p.initiative })));
      return updatedParticipants;
    });

    setLastAddedInitiative(newInitiative);
  };

  const handleResolveInitiativeTie = (firstId) => {
    if (!initiativeTie) return;
    // Find the participant to update
    const allTied = [initiativeTie.participant, ...initiativeTie.tiedParticipants];
    const selected = allTied.find(p => p.battleId === firstId);
    if (!selected) return;
    // Get the other participant (the one not selected)
    const otherParticipant = allTied.find(p => p.battleId !== firstId);
    if (!otherParticipant) return;
    if (initiativeTie.inline) {
      setBattleParticipants(prev => {
        const updated = prev.map(p => {
          if (p.battleId === selected.battleId) {
            return { ...p, initiative: initiativeTie.newValue + 1 };
          }
          if (p.battleId === otherParticipant.battleId) {
            return { ...p, initiative: initiativeTie.newValue };
          }
          return p;
        });
        // After updating, check for ties for both values
        const tieCheck = (val) => updated.filter(p => p.initiative === val);
        if (tieCheck(initiativeTie.newValue).length > 1) {
          setLastAddedInitiative(initiativeTie.newValue);
          setInitiativeTie(null);
          setPendingInitiativeParticipant(null);
        } else if (tieCheck(initiativeTie.newValue + 1).length > 1) {
          setLastAddedInitiative(initiativeTie.newValue + 1);
          setInitiativeTie(null);
          setPendingInitiativeParticipant(null);
        } else {
          setLastAddedInitiative(null);
          setInitiativeTie(null);
          setPendingInitiativeParticipant(null);
        }
        return [...updated].sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
      });
      // Do not clear tie state here!
      // setInitiativeTie(null);
      // setPendingInitiativeParticipant(null);
      // Do not advance to next participant here; let useEffect handle it after tie check
      return;
    }
    // Start battle flow: add both participants with different initiatives
    const newSelectedParticipant = {
      ...selected,
      initiative: initiativeTie.newValue + 1,
      status: '',
      battleId: Date.now(),
      type: selected.type || 'creature',
      hp: selected.hp || 0,
      id: selected.id,
      damageInput: '',
      maxHp: (selected.maxHp !== undefined && selected.maxHp !== '' && selected.maxHp !== null) ? Number(selected.maxHp) : (selected.hp || 0)
    };
    const newOtherParticipant = {
      ...otherParticipant,
      initiative: initiativeTie.newValue,
      status: '',
      battleId: Date.now() + 1, // Ensure different battleId
      type: otherParticipant.type || 'creature',
      hp: otherParticipant.hp || 0,
      id: otherParticipant.id,
      damageInput: '',
      maxHp: (otherParticipant.maxHp !== undefined && otherParticipant.maxHp !== '' && otherParticipant.maxHp !== null) ? Number(otherParticipant.maxHp) : (otherParticipant.hp || 0)
    };
    setBattleParticipants(prevParticipants => {
      // Remove any existing participants with the same initiative
      const filtered = prevParticipants.filter(
        p => !(p.initiative === initiativeTie.newValue && allTied.some(tied => tied.battleId === p.battleId))
      );
      const updatedParticipants = [...filtered, newSelectedParticipant, newOtherParticipant];
      setLastAddedInitiative(null);
      setInitiativeTie(null);
      setPendingInitiativeParticipant(null);
      return updatedParticipants;
    });
    // Do not clear tie state here!
    // setInitiativeTie(null);
    // setPendingInitiativeParticipant(null);
    // Do not advance to next participant here; let useEffect handle it after tie check
  };

  // Global tie detection: runs whenever battleParticipants changes and there is no current tie
  useEffect(() => {
    if (initiativeTie) return;
    // Only check if all participants have initiatives
    if (battleParticipants.length > 1 && battleParticipants.every(p => p.initiative !== null && p.initiative !== undefined)) {
      const initiativeCounts = battleParticipants.reduce((acc, p) => {
        if (p.initiative != null) {
          acc[p.initiative] = (acc[p.initiative] || []);
          acc[p.initiative].push(p);
        }
        return acc;
      }, {});
      const foundTie = Object.values(initiativeCounts).find(arr => arr.length > 1);
      if (foundTie) {
        setInitiativeTie({
          participant: foundTie[0],
          tiedParticipants: foundTie.slice(1),
          newValue: foundTie[0].initiative
        });
        setPendingInitiativeParticipant(null);
      }
    }
  }, [battleParticipants, initiativeTie]);

  // Sort participants by initiative after all initiatives are entered and all ties are resolved
  useEffect(() => {
    if (
      battleParticipants.length > 1 &&
      battleParticipants.every(p => p.initiative !== null && p.initiative !== undefined) &&
      !initiativeTie &&
      !initiativeDialogOpen
    ) {
      setBattleParticipants(prev => {
        const sorted = [...prev].sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
        // Only update if the order has actually changed
        if (JSON.stringify(sorted.map(p => p.battleId)) !== JSON.stringify(prev.map(p => p.battleId))) {
          return sorted;
        }
        return prev;
      });
    }
  }, [battleParticipants, initiativeTie, initiativeDialogOpen]);

  const handleInitiativeSkip = () => {
    const nextParticipants = remainingParticipants.slice(1);
    setRemainingParticipants(nextParticipants);
    
    if (nextParticipants.length === 0) {
      setInitiativeDialogOpen(false);
    }
  };

  const handleInitiativeClose = () => {
    setInitiativeDialogOpen(false);
    handleEndBattle();
  };

  // Helper to get the next valid turn (skipping dead creatures)
  const getNextValidTurn = (sorted, currentIndex) => {
    let nextIndex = (currentIndex + 1) % sorted.length;
    let looped = false;
    // Only skip creatures with HP <= 0, not players
    while (sorted[nextIndex].type === 'creature' && Number(sorted[nextIndex].hp) <= 0) {
      nextIndex = (nextIndex + 1) % sorted.length;
      if (nextIndex === currentIndex) {
        looped = true;
        break;
      }
    }
    return looped ? null : nextIndex;
  };

  const handleFinishTurn = () => {
    if (!battleParticipants.length) return;
    // Sort participants by initiative (highest first)
    const sorted = [...battleParticipants].sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
    const currentIndex = sorted.findIndex(p => p.battleId === currentTurn);
    if (currentIndex === -1) {
      setCurrentTurn(sorted[0].battleId);
      return;
    }
    let nextIndex = getNextValidTurn(sorted, currentIndex);
    if (nextIndex === null) {
      setCurrentTurn(sorted[0].battleId);
      setCurrentRound(prev => prev + 1);
      setBattleParticipants(sorted);
      return;
    }
    const nextTurnId = sorted[nextIndex].battleId;
    setCurrentTurn(nextTurnId);
    // Only increment round when cycling back to the first participant
    if (nextIndex === 0) {
      setCurrentRound(prev => prev + 1);
    }
    setBattleParticipants(sorted);
  };

  const handleUpdateCreatureHP = (creatureId, newHP) => {
    // Update in battle participants
    setBattleParticipants(prevParticipants => 
      prevParticipants.map(participant => 
        participant.id === creatureId 
          ? { ...participant, hp: newHP }
          : participant
      )
    );
    
    // Update in battle creatures
    setBattleCreatures(prevCreatures => 
      prevCreatures.map(creature => 
        creature.id === creatureId 
          ? { ...creature, hp: newHP }
          : creature
      )
    );
  };

  const handleAddToBattle = (entity) => {
    let newName = entity.name;
    let type = entity.type;
    if (!type) {
      // If type is not set, infer from presence of hp
      type = entity.hp ? 'creature' : 'player';
    }
    if (type === 'creature') {
      // Count how many creatures with the same base name are already in battle
      const baseName = entity.name.replace(/ \d+$/, '');
      const sameNameCount = battleParticipants.filter(
        p => (p.type === 'creature') && p.name && p.name.startsWith(baseName)
      ).length;
      if (sameNameCount > 0) {
        newName = `${baseName} ${sameNameCount + 1}`;
      }
    }
    const newParticipant = {
      ...entity,
      name: newName,
      battleId: Date.now(),
      initiative: null,
      type: type, // Ensure type is set correctly
      maxHp: (entity.maxHp !== undefined && entity.maxHp !== '' && entity.maxHp !== null) ? Number(entity.maxHp) : (entity.hp || 0), // Ensure maxHp is set if not present
      hp: (entity.hp !== undefined && entity.hp !== '' && entity.hp !== null) ? Number(entity.hp) : ((entity.maxHp !== undefined && entity.maxHp !== '' && entity.maxHp !== null) ? Number(entity.maxHp) : 0)
    };
    setBattleParticipants(prev => [...prev, newParticipant]);
  };

  const handleRemoveParticipant = (battleId) => {
    setBattleParticipants(prev => prev.filter(p => p.battleId !== battleId));
  };

  const handleRemoveAllParticipants = () => {
    setBattleParticipants([]);
  };

  const handleRemoveAllPlayers = () => {
    setBattleParticipants(prev => prev.filter(p => p.type !== 'player'));
  };

  const handleRemoveAllCreatures = () => {
    setBattleParticipants(prev => prev.filter(p => p.type !== 'creature'));
  };

  const handleRemoveAllSavedCreatures = () => {
    setBattleCreatures([]);
  };

  const handleRemoveAllSavedPlayers = () => {
    setPlayers([]);
  };

  // Update initiative and sort participants
  const handleUpdateParticipantInitiative = (battleId, newInitiative) => {
    console.log('handleUpdateParticipantInitiative called for', battleId, 'with newInitiative:', newInitiative);
    // Find the participant being edited
    const participant = battleParticipants.find(p => p.battleId === battleId);
    // Find all other participants with the same initiative
    const tiedParticipants = battleParticipants.filter(
      p => p.battleId !== battleId && p.initiative === newInitiative
    );
    if (tiedParticipants.length > 0) {
      setInitiativeTie({ participant, tiedParticipants, newValue: newInitiative, inline: true });
      setPendingInitiativeParticipant({ ...participant, initiative: newInitiative });
      return;
    }
    // No tie, update as normal
    setBattleParticipants(prev => {
      const updated = prev.map(p => p.battleId === battleId ? { ...p, initiative: newInitiative } : p);
      return [...updated].sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
    });
  };

  // Update HP for a participant in battle
  const handleUpdateParticipantHP = (battleId, newHP) => {
    setBattleParticipants(prevParticipants => {
      return prevParticipants.map(participant => {
        if (participant.battleId !== battleId) return participant;
        const maxHp = Number(participant.maxHp) || Number(participant.hp);
        const clampedHP = Math.min(maxHp, Math.max(0, Number(newHP)));
        let updated = { ...participant, hp: clampedHP };
        if (updated.type === 'creature') {
          updated.resistances = calculateCurrentResistances({ ...updated, hp: clampedHP });
        }
        return updated;
      });
    });
  };

  // Add new function to handle damage with temp HP consideration
  const handleParticipantDamage = (battleId, damage) => {
    setBattleParticipants(prevParticipants => {
      return prevParticipants.map(participant => {
        if (participant.battleId !== battleId) return participant;
        const currentTempHP = Number(participant.tempHp) || 0;
        const currentHP = Number(participant.hp) || 0;
        const damageAmount = Number(damage);
        if (currentTempHP > 0) {
          if (damageAmount >= currentTempHP) {
            // Temp HP is depleted, remaining damage goes to normal HP
            const remainingDamage = damageAmount - currentTempHP;
            const newHP = Math.max(0, currentHP - remainingDamage);
            let updated = { ...participant, tempHp: 0, hp: newHP };
            if (updated.type === 'creature') {
              updated.resistances = calculateCurrentResistances({ ...updated, hp: newHP });
            }
            return updated;
          } else {
            // Temp HP absorbs all damage
            return { ...participant, tempHp: currentTempHP - damageAmount };
          }
        } else {
          // No temp HP, damage goes directly to normal HP
          const newHP = Math.max(0, currentHP - damageAmount);
          let updated = { ...participant, hp: newHP };
          if (updated.type === 'creature') {
            updated.resistances = calculateCurrentResistances({ ...updated, hp: newHP });
          }
          return updated;
        }
      });
    });
  };

  // Update a participant in battle by battleId
  const handleUpdateBattleParticipant = (updatedParticipant) => {
    setBattleParticipants(prev => prev.map(p => p.battleId === updatedParticipant.battleId ? { ...p, ...updatedParticipant } : p));
  };

  // Handler to set initiative tie state from children
  const handleInitiativeTie = (tieState) => setInitiativeTie(tieState);

  // Consolidate initiative-related effects into a single useEffect
  useEffect(() => {
    // Skip if no last added initiative or if we're not in initiative entry mode
    if (lastAddedInitiative === null || !initiativeDialogOpen) return;

    console.log('Initiative effect triggered with lastAddedInitiative:', lastAddedInitiative);
    console.log('Current battle participants:', battleParticipants.map(p => ({ name: p.name, type: p.type, initiative: p.initiative })));
    console.log('Remaining participants:', remainingParticipants.map(p => ({ name: p.name, type: p.type })));

    // Check for ties
    const ties = battleParticipants.filter(p => p.initiative === lastAddedInitiative);
    if (ties.length > 1) {
      console.log('Found initiative tie:', ties.map(p => ({ name: p.name, type: p.type, initiative: p.initiative })));
      setInitiativeTie({ 
        participant: ties[0], 
        tiedParticipants: ties.slice(1), 
        newValue: lastAddedInitiative 
      });
      setPendingInitiativeParticipant(null);
      setInitiativeDialogOpen(false); // Hide initiative dialog while resolving tie
      return;
    }

    // No tie, proceed to next participant
    if (remainingParticipants.length > 0) {
      const nextParticipants = remainingParticipants.slice(1);
      console.log('Moving to next participants:', nextParticipants.map(p => ({ name: p.name, type: p.type })));
      setRemainingParticipants(nextParticipants);
      
      if (nextParticipants.length > 0) {
        // Keep dialog open for next participant
        setInitiativeDialogOpen(true);
      } else {
        // All participants have initiatives, sort them
        console.log('All participants have initiatives, final sorting');
        setBattleParticipants(prev => [...prev].sort((a, b) => (b.initiative || 0) - (a.initiative || 0)));
        setInitiativeDialogOpen(false);
      }
    } else {
      // No more remaining participants, sort and close dialog
      console.log('No more remaining participants, final sorting');
      setBattleParticipants(prev => [...prev].sort((a, b) => (b.initiative || 0) - (a.initiative || 0)));
      setInitiativeDialogOpen(false);
    }
    
    // Reset last added initiative
    setLastAddedInitiative(null);
  }, [lastAddedInitiative, initiativeDialogOpen, battleParticipants, remainingParticipants]);

  // When a tie is resolved, resume initiative dialog if there are more participants who need initiative
  useEffect(() => {
    if (
      !initiativeTie &&
      remainingParticipants.length > 0 &&
      !initiativeDialogOpen &&
      // Only open if the next participant does not have initiative
      (!battleParticipants.some(p => p.id === remainingParticipants[0].id) ||
        battleParticipants.find(p => p.id === remainingParticipants[0].id)?.initiative == null)
    ) {
      setInitiativeDialogOpen(true);
    }
  }, [initiativeTie, remainingParticipants, initiativeDialogOpen, battleParticipants]);

  // Expose window functions in a single effect
  useEffect(() => {
    // Set up window functions
    window.updateBattleParticipantInitiative = (battleId, newInitiative) => {
      if (!battleId) return;
      setBattleParticipants(prev => prev.map(p => p.battleId === battleId ? { ...p, initiative: newInitiative } : p));
    };

    window.handleParticipantDamage = handleParticipantDamage;
    window.handleUpdateParticipantTempHP = handleUpdateParticipantTempHP;

    // Cleanup
    return () => {
      window.updateBattleParticipantInitiative = undefined;
      window.handleParticipantDamage = undefined;
      window.handleUpdateParticipantTempHP = undefined;
    };
  }, []); // Empty dependency array since these functions don't need to be recreated

  // Add handleAddSpell function
  const handleAddSpell = (spell) => {
    // Convert spell to attack format
    const spellAttack = {
      id: Date.now(),
      attackName: spell.name,
      attackType: spell.system.damage ? 'spell' : 'regularSpell',
      attackCategory: spell.system.damage ? 'spell' : 'regularSpell',
      actions: spell.system.time?.value || '2',
      range: spell.system.range?.value || '',
      description: spell.system.description?.value || '',
      targetOrArea: spell.system.area ? 'area' : 'target',
      area: spell.system.area ? `${spell.system.area.value}-foot ${spell.system.area.type}` : '',
      areaType: spell.system.area?.type || '',
      save: spell.system.defense?.save ? `${spell.system.defense.save.statistic}${spell.system.defense.save.basic ? ' (basic)' : ''}` : '',
      damage: spell.system.damage ? Object.values(spell.system.damage).map(d => `${d.formula} ${d.type}`).join(' plus ') : '',
      duration: spell.system.duration?.value || '',
      targets: spell.system.target?.value || ''
    };

    // Add to creatures list as a spell
    setCreatures(prev => [...prev, spellAttack]);
  };

  // Initialize databases on component mount
  useEffect(() => {
    const initializeDatabases = async () => {
      try {
        // Initialize monster database
        const isMonsterPopulated = await isMonsterDBPopulated();
        if (!isMonsterPopulated) {
          console.log('Initializing monster database...');
          await loadMonstersIntoDB();
          console.log('Monster database initialized successfully');
        } else {
          console.log('Monster database already populated');
        }

        // Initialize spell database
        const isSpellPopulated = await isSpellDBPopulated();
        if (!isSpellPopulated) {
          console.log('Initializing spell database...');
          await loadSpellsIntoDB();
          console.log('Spell database initialized successfully');
        } else {
          console.log('Spell database already populated');
        }
      } catch (error) {
        console.error('Error initializing databases:', error);
      }
    };

    initializeDatabases();
  }, []);

  // Helper to get submenu list
  const getReferenceList = () => {
    const section = quickRefData.find(q => q.name === referencesMenu);
    return section ? section.list : [];
  };

  // Helper: Map condition names to quickRefData Conditions
  const conditionList = quickRefData.find(q => q.name === 'Conditions')?.list || [];
  const conditionNames = conditionList.map(c => c.name.toLowerCase());

  function linkifyConditions(text) {
    if (!text) return text;
    // Replace @UUID[Compendium.pf2e.conditionitems.Item.X] or {...} with a link
    return text.replace(/@UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z]+)](\{([^}]+)\})?/g, (match, cond, _, label) => {
      // Try to match the condition name (case-insensitive)
      const condName = (label || cond).replace(/-/g, ' ');
      const found = conditionList.find(c => c.name.toLowerCase() === condName.toLowerCase());
      if (found) {
        return `<a href="#" class="condition-link" data-condition="${found.name}">${found.name}</a>`;
      } else {
        // Fallback: just show the label or cond
        return label || cond;
      }
    });
  }

  // Add new function to handle temporary HP
  const handleUpdateParticipantTempHP = (battleId, tempHP) => {
    setBattleParticipants(prevParticipants => {
      return prevParticipants.map(participant => {
        if (participant.battleId !== battleId) return participant;
        const clampedTempHP = Math.max(0, Number(tempHP));
        let updated = { ...participant, tempHp: clampedTempHP };
        if (updated.type === 'creature') {
          updated.resistances = calculateCurrentResistances(updated);
        }
        return updated;
      });
    });
  };

  return (
    <div className="d-flex flex-column" style={{ height: '100dvh' }}>
      <Container fluid className="mt-3 flex-grow-1" style={{ flex: '1 1 auto', overflowY: 'auto', minHeight: 0 }}>
        <audio ref={audioRef} src={fillip} />
        
        {showFillipMessage && (
          <Alert 
            variant="danger" 
            className="position-fixed top-0 start-50 translate-middle-x mt-3"
            style={{ zIndex: 9999 }}
            onClose={() => setShowFillipMessage(false)} 
            dismissible
          >
            <Alert.Heading>ФИЛЛИПА НЕЛЬЗЯ ОСТАНОВИТЬ!</Alert.Heading>
          </Alert>
        )}

        <Tab.Container activeKey={currentTab} onSelect={handleTabChange}>
          <Nav variant="tabs" className="mb-3 d-flex justify-content-center">
            <Nav.Item>
              <Nav.Link eventKey="battle">Battle</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="creatures">Creatures</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="players">Players</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="bestiary">Bestiary</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="spells">Spells</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="references">References</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="share">Share</Nav.Link>
            </Nav.Item>
          </Nav>

          {showKidMeme && (
            <div className="text-center mb-3">
              <Image src={kidMeme} alt="Kid Meme" fluid style={{ maxHeight: '200px' }} />
            </div>
          )}

          <Tab.Content>
            <Tab.Pane eventKey="battle" style={currentTab === 'battle' ? battleTabStyle : {}}>
              {showBattleContent && (
                <BattleTab
                  participants={battleParticipants}
                  battleStarted={battleStarted}
                  currentTurn={currentTurn}
                  currentRound={currentRound}
                  onStartBattle={handleStartBattle}
                  onFinishTurn={handleFinishTurn}
                  onEndBattle={handleEndBattle}
                  onRemoveParticipant={handleRemoveParticipant}
                  onRemoveAllParticipants={handleRemoveAllParticipants}
                  onRemoveAllPlayers={handleRemoveAllPlayers}
                  onRemoveAllCreatures={handleRemoveAllCreatures}
                  onUpdateParticipantInitiative={handleUpdateParticipantInitiative}
                  onUpdateParticipantHP={handleUpdateParticipantHP}
                  onUpdateBattleParticipant={handleUpdateBattleParticipant}
                  initiativeTie={initiativeTie}
                  onInitiativeTie={handleInitiativeTie}
                  onResolveInitiativeTie={handleResolveInitiativeTie}
                />
              )}
            </Tab.Pane>
            <Tab.Pane eventKey="creatures">
              <CreaturesTab
                savedCreatures={creatures}
                onAddCreature={handleAddCreature}
                onUpdateCreature={handleUpdateCreature}
                onDeleteCreature={handleDeleteCreature}
                onAddToBattle={handleAddToBattle}
              />
            </Tab.Pane>
            <Tab.Pane eventKey="players">
              <PlayersTab
                players={players}
                onAddPlayer={handleAddPlayer}
                onUpdatePlayer={handleUpdatePlayer}
                onDeletePlayer={handleDeletePlayer}
                onAddToBattle={handleAddToBattle}
              />
            </Tab.Pane>
            <Tab.Pane eventKey="bestiary">
              <BestiaryTab onAddCreature={handleAddCreature} />
            </Tab.Pane>
            <Tab.Pane eventKey="spells">
              <SpellsTab onAddSpell={handleAddSpell} />
            </Tab.Pane>
            <Tab.Pane eventKey="references">
              <div className="mb-3 d-flex gap-2">
                {['Conditions', 'Weapon Traits', 'Crit Specialization'].map(menu => (
                  <Button
                    key={menu}
                    variant={referencesMenu === menu ? 'primary' : 'outline-primary'}
                    onClick={() => { setReferencesMenu(menu); setSelectedReference(null); }}
                  >
                    {menu}
                  </Button>
                ))}
              </div>
              <div className="row">
                <div className="col-md-4">
                  <ul className="list-group">
                    {getReferenceList().map(item => (
                      <li
                        key={item.name}
                        className={`list-group-item${selectedReference && selectedReference.name === item.name ? ' active' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedReference(item)}
                      >
                        {item.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="col-md-8">
                  {selectedReference && (
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">{selectedReference.name}</h5>
                        <p className="card-text" dangerouslySetInnerHTML={{ __html: linkifyConditions(selectedReference.description) }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Tab.Pane>
            <Tab.Pane eventKey="share">
              <EncounterSharing 
                onDataLoaded={(data) => {
                  // This callback will be called when data is loaded from Firebase
                  console.log('Encounter data loaded:', data);
                  
                  // The localStorage data has already been restored by EncounterService
                  // Force re-read from localStorage to update the UI
                  try {
                    const updatedCreatures = JSON.parse(localStorage.getItem('creatures') || '[]');
                    const updatedBattleCreatures = JSON.parse(localStorage.getItem('battleCreatures') || '[]');
                    const updatedPlayers = JSON.parse(localStorage.getItem('players') || '[]');
                    const updatedBattleParticipants = JSON.parse(localStorage.getItem('battleParticipants') || '[]');
                    const updatedCurrentTurn = localStorage.getItem('currentTurn');
                    const updatedBattleStarted = localStorage.getItem('battleStarted') === 'true';
                    const updatedCurrentRound = parseInt(localStorage.getItem('currentRound') || '1');
                    
                    // Update state to reflect the loaded data
                    setCreatures(updatedCreatures);
                    setBattleCreatures(updatedBattleCreatures);
                    setPlayers(updatedPlayers);
                    setBattleParticipants(updatedBattleParticipants);
                    setCurrentTurn(updatedCurrentTurn);
                    setBattleStarted(updatedBattleStarted);
                    setCurrentRound(updatedCurrentRound);
                    
                    console.log('App state updated with loaded encounter data');
                  } catch (error) {
                    console.error('Error updating app state:', error);
                  }
                }}
              />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
        
        <InitiativeDialog
          open={initiativeDialogOpen}
          onClose={handleInitiativeClose}
          onConfirm={handleInitiativeConfirm}
          onSkip={handleInitiativeSkip}
          participant={remainingParticipants[0]}
        />

        {(initiativeTie && handleResolveInitiativeTie && initiativeTie.participant && initiativeTie.tiedParticipants) ? (
          <div className="modal show fade d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Initiative Tie</h5>
                  <button type="button" className="btn-close" onClick={() => handleResolveInitiativeTie(null)}></button>
                </div>
                <div className="modal-body">
                  <p>
                    Multiple participants have initiative <strong>{initiativeTie.newValue}</strong>.<br />
                    Who should go first?
                  </p>
                  <ul>
                    {[initiativeTie.participant, ...initiativeTie.tiedParticipants].map(p => (
                      <li key={p.battleId}>
                        <Button variant="outline-primary" onClick={() => handleResolveInitiativeTie(p.battleId)}>
                          {p.name}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="modal-footer">
                  <Button variant="secondary" onClick={() => handleResolveInitiativeTie(null)}>Cancel</Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Container>

      <footer className="bg-light py-3 border-top" style={{ flexShrink: 0 }}>
        <Container fluid>
          <div className="d-flex justify-content-center">
            <Button 
              variant={isMusicPlaying ? "success" : "outline-success"}
              onClick={toggleMusic}
              className="rounded-pill px-4"
            >
              {isMusicPlaying ? "🎵 Остановить Филлипа.." : "🎵 Сделай Красиво"}
            </Button>
          </div>
        </Container>
      </footer>

      <Modal show={showStopConfirmModal} onHide={handleStopCancel} centered>
        <Modal.Header closeButton>
          <Modal.Title>Подтверждение</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Вы уверены, что хотите остановить Филлипа?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleStopCancel}>
            Нет
          </Button>
          <Button variant="danger" onClick={handleStopConfirm}>
            Да
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default App; 
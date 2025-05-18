import React, { useState, useEffect, useRef } from 'react';
import { Container, Nav, Tab, Button, Modal, Alert } from 'react-bootstrap';
import CreaturesTab from './components/CreaturesTab';
import BattleTab from './components/BattleTab';
import PlayersTab from './components/PlayersTab';
import InitiativeDialog from './components/InitiativeDialog';
import fillip from './assets/fillip.mp3';
import fillipBg from './assets/fillip.jpg';

function App() {
  const audioRef = useRef(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showStopConfirmModal, setShowStopConfirmModal] = useState(false);
  const [showFillipMessage, setShowFillipMessage] = useState(false);
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
      type: participant.type || (participant.hp ? 'creature' : 'player')
    }));
    
    if (allParticipants.length === 0) {
      alert('Please add at least one participant to start the battle.');
      return;
    }

    setBattleStarted(true);
    setCurrentRound(1);
    // Clear previous battle state
    setBattleParticipants([]);
    setCurrentTurn(null);
    
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
    const currentParticipant = remainingParticipants[0];
    const newInitiative = Number(initiative);
    // Check for tie
    const tiedParticipants = battleParticipants.filter(p => p.initiative === newInitiative);
    if (tiedParticipants.length > 0) {
      setInitiativeTie({ participant: currentParticipant, tiedParticipants, newValue: newInitiative });
      setPendingInitiativeParticipant({ ...currentParticipant, initiative: newInitiative });
      setInitiativeDialogOpen(false);
      return;
    }
    // No tie, proceed as before
    const newParticipant = {
      ...currentParticipant,
      initiative: newInitiative,
      status: '',
      battleId: Date.now(),
      type: currentParticipant.type || 'creature',
      hp: currentParticipant.hp || 0,
      id: currentParticipant.id,
      damageInput: ''
    };
    setBattleParticipants(prevParticipants => {
      // Always just add the new participant; tie resolution is handled elsewhere
      const updatedParticipants = [...prevParticipants, newParticipant];
      if (remainingParticipants.length === 1) {
        const sorted = [...updatedParticipants].sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
        if (sorted.length > 0) {
          setCurrentTurn(sorted[0].battleId);
        }
        return sorted;
      }
      return updatedParticipants;
    });
    // Move to next participant
    const nextParticipants = remainingParticipants.slice(1);
    setRemainingParticipants(nextParticipants);
    if (nextParticipants.length === 0) {
      setInitiativeDialogOpen(false);
    }
  };

  // Handler for resolving tie during start battle
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
      // Inline edit: update both participants' initiatives
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
        return [...updated].sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
      });
      setInitiativeTie(null);
      setPendingInitiativeParticipant(null);
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
      damageInput: ''
    };

    const newOtherParticipant = {
      ...otherParticipant,
      initiative: initiativeTie.newValue,
      status: '',
      battleId: Date.now() + 1, // Ensure different battleId
      type: otherParticipant.type || 'creature',
      hp: otherParticipant.hp || 0,
      id: otherParticipant.id,
      damageInput: ''
    };

    setBattleParticipants(prevParticipants => {
      // Remove any existing participants with the same initiative
      const filtered = prevParticipants.filter(
        p => !(p.initiative === initiativeTie.newValue && allTied.some(tied => tied.battleId === p.battleId))
      );
      const updatedParticipants = [...filtered, newSelectedParticipant, newOtherParticipant];
      
      if (remainingParticipants.length === 1) {
        const sorted = [...updatedParticipants].sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
        if (sorted.length > 0) {
          setCurrentTurn(sorted[0].battleId);
        }
        return sorted;
      }
      return updatedParticipants;
    });

    // Move to next participant
    const nextParticipants = remainingParticipants.slice(1);
    setRemainingParticipants(nextParticipants);
    if (nextParticipants.length === 0) {
      setInitiativeDialogOpen(false);
    }
    setInitiativeTie(null);
    setPendingInitiativeParticipant(null);
  };

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
      type: type // Ensure type is set correctly
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
    console.log('handleUpdateParticipantHP called with', { battleId, newHP });
    // Ensure HP cannot go below 0
    const clampedHP = Math.max(0, Number(newHP));
    setBattleParticipants(prev => {
      const updated = prev.map(p => {
        console.log('Checking participant', p.name, p.battleId, p.type, p.hp);
        if (p.battleId === battleId) {
          console.log('Matched participant', p.name, 'type:', p.type, 'old HP:', p.hp, 'new HP:', clampedHP);
          // If player and HP drops to 0 or below, boost initiative if needed
          if (p.type === 'player' && clampedHP === 0) {
            const maxCreatureInit = Math.max(
              ...prev.filter(c => c.type === 'creature').map(c => Number(c.initiative) || 0),
              0
            );
            let newInitiative = Number(p.initiative) || 0;
            if (newInitiative <= maxCreatureInit) {
              newInitiative = maxCreatureInit + 1;
              console.log(`Boosting player initiative:`, { name: p.name, oldInit: p.initiative, newInit: newInitiative });
            }
            return { ...p, hp: clampedHP, initiative: newInitiative };
          }
          return { ...p, hp: clampedHP };
        }
        return p;
      });
      // Sort by initiative after any updates
      const sorted = [...updated].sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
      // If we're updating a player's HP to 0, we need to ensure they're in the right position
      const updatedPlayer = sorted.find(p => p.battleId === battleId);
      if (updatedPlayer?.type === 'player' && clampedHP === 0) {
        // Find the highest creature initiative
        const highestCreature = sorted.find(p => p.type === 'creature');
        if (highestCreature && updatedPlayer.initiative <= highestCreature.initiative) {
          // Move the player right after the highest creature
          const withoutPlayer = sorted.filter(p => p.battleId !== battleId);
          const creatureIndex = withoutPlayer.findIndex(p => p.battleId === highestCreature.battleId);
          withoutPlayer.splice(creatureIndex + 1, 0, updatedPlayer);
          return withoutPlayer;
        }
      }
      return sorted;
    });
  };

  // Update a participant in battle by battleId
  const handleUpdateBattleParticipant = (updatedParticipant) => {
    setBattleParticipants(prev => prev.map(p => p.battleId === updatedParticipant.battleId ? { ...p, ...updatedParticipant } : p));
  };

  // Handler to set initiative tie state from children
  const handleInitiativeTie = (tieState) => setInitiativeTie(tieState);

  return (
    <Container fluid className="mt-3">
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
        </Nav>

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

      <div className="position-fixed bottom-0 start-50 translate-middle-x mb-3">
        <Button 
          variant={isMusicPlaying ? "success" : "outline-success"}
          onClick={toggleMusic}
          className="rounded-pill px-4"
        >
          {isMusicPlaying ? "🎵 Остановить Филлипа.." : "🎵 Сделай Красиво"}
        </Button>
      </div>
    </Container>
  );
}

export default App; 
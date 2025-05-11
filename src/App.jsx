import React, { useState, useEffect } from 'react';
import { Container, Box, Tabs, Tab, Typography } from '@mui/material';
import MonstersTab from './components/MonstersTab';
import BattleTab from './components/BattleTab';
import PlayersTab from './components/PlayersTab';

function App() {
  // Initialize state with localStorage values
  const [monsters, setMonsters] = useState(() => {
    try {
      const savedMonsters = localStorage.getItem('monsters');
      return savedMonsters ? JSON.parse(savedMonsters) : [];
    } catch (error) {
      console.error('Error loading monsters from localStorage:', error);
      return [];
    }
  });

  const [battleMonsters, setBattleMonsters] = useState(() => {
    try {
      const savedBattleMonsters = localStorage.getItem('battleMonsters');
      return savedBattleMonsters ? JSON.parse(savedBattleMonsters) : [];
    } catch (error) {
      console.error('Error loading battle monsters from localStorage:', error);
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

  const [currentTab, setCurrentTab] = useState(0);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('monsters', JSON.stringify(monsters));
    } catch (error) {
      console.error('Error saving monsters to localStorage:', error);
    }
  }, [monsters]);

  useEffect(() => {
    try {
      localStorage.setItem('battleMonsters', JSON.stringify(battleMonsters));
    } catch (error) {
      console.error('Error saving battle monsters to localStorage:', error);
    }
  }, [battleMonsters]);

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

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleAddMonster = (monster) => {
    setMonsters([...monsters, { ...monster, id: Date.now() }]);
  };

  const handleAddMonsterToBattle = (monster) => {
    setBattleMonsters([...battleMonsters, { ...monster, id: Date.now() }]);
  };

  const handleRemoveMonster = (monsterId) => {
    setBattleMonsters(battleMonsters.filter(monster => monster.id !== monsterId));
  };

  const handleUpdateMonster = (updatedMonster) => {
    // Update in monsters list
    setMonsters(monsters.map(monster => 
      monster.id === updatedMonster.id ? updatedMonster : monster
    ));
    
    // Update in battleMonsters list if it exists there
    setBattleMonsters(battleMonsters.map(monster => 
      monster.id === updatedMonster.id ? updatedMonster : monster
    ));
  };

  const handleAddPlayer = (player) => {
    setPlayers([...players, { ...player, id: Date.now() }]);
  };

  const handleDeletePlayer = (playerId) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const handleStartBattle = () => {
    // Clear previous battle state
    setBattleParticipants([]);
    setCurrentTurn(null);
    setBattleStarted(false);
    
    // Create a copy of players and monsters to track who needs initiative
    const playersNeedingInitiative = [...players];
    const monstersNeedingInitiative = [...battleMonsters];
    promptForInitiative([...playersNeedingInitiative, ...monstersNeedingInitiative]);
  };

  const handleEndBattle = () => {
    setBattleStarted(false);
    setCurrentTurn(null);
    setBattleParticipants([]); // Clear the initiative order
  };

  const promptForInitiative = (remainingParticipants) => {
    if (remainingParticipants.length === 0) {
      // All participants have initiative, start the battle
      const sortedParticipants = [...battleParticipants].sort((a, b) => 
        parseInt(b.initiative) - parseInt(a.initiative)
      );
      if (sortedParticipants.length > 0) {
        // Use a single state update to ensure proper rendering
        Promise.resolve().then(() => {
          setBattleStarted(true);
          setCurrentTurn(sortedParticipants[0].battleId);
        });
      }
      return;
    }

    const currentParticipant = remainingParticipants[0];
    const initiative = prompt(`Enter initiative for ${currentParticipant.name}:`);
    
    if (initiative !== null) {
      const newParticipant = {
        ...currentParticipant,
        initiative: parseInt(initiative) || 0,
        status: '',
        battleId: Date.now() // Add unique ID for battle participants
      };
      
      setBattleParticipants(prevParticipants => {
        const updatedParticipants = [...prevParticipants, newParticipant];
        // If this was the last participant, start the battle
        if (remainingParticipants.length === 1) {
          const sorted = [...updatedParticipants].sort((a, b) => 
            parseInt(b.initiative) - parseInt(a.initiative)
          );
          if (sorted.length > 0) {
            Promise.resolve().then(() => {
              setBattleStarted(true);
              setCurrentTurn(sorted[0].battleId);
            });
          }
        }
        return updatedParticipants;
      });
      
      // Move to next participant
      promptForInitiative(remainingParticipants.slice(1));
    } else {
      // If user cancels initiative input, end the battle
      handleEndBattle();
    }
  };

  const handleFinishTurn = () => {
    const sortedParticipants = [...battleParticipants].sort((a, b) => 
      parseInt(b.initiative) - parseInt(a.initiative)
    );
    const currentIndex = sortedParticipants.findIndex(p => p.battleId === currentTurn);
    const nextIndex = (currentIndex + 1) % sortedParticipants.length;
    setCurrentTurn(sortedParticipants[nextIndex].battleId);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Pathfinder 2e Encounter Builder
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange} centered>
            <Tab label="Battle" />
            <Tab label="Monsters" />
            <Tab label="Players" />
          </Tabs>
        </Box>
        {currentTab === 0 && (
          <BattleTab 
            participants={battleParticipants} 
            monsters={battleMonsters}
            onUpdateMonster={handleUpdateMonster}
            currentTurn={currentTurn}
            battleStarted={battleStarted}
            onStartBattle={handleStartBattle}
            onFinishTurn={handleFinishTurn}
            setBattleStarted={setBattleStarted}
            setCurrentTurn={setCurrentTurn}
            players={players}
            battleMonsters={battleMonsters}
            onEndBattle={handleEndBattle}
            onRemoveMonster={handleRemoveMonster}
          />
        )}
        {currentTab === 1 && (
          <MonstersTab 
            onAddMonster={handleAddMonster} 
            onAddMonsterToBattle={handleAddMonsterToBattle}
            onUpdateMonster={handleUpdateMonster}
            monsters={monsters} 
          />
        )}
        {currentTab === 2 && (
          <PlayersTab
            players={players}
            onAddPlayer={handleAddPlayer}
            onDeletePlayer={handleDeletePlayer}
          />
        )}
      </Box>
    </Container>
  );
}

export default App; 
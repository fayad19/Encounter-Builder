import React, { useState, StrictMode } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, ListGroupItem, Badge, Modal } from 'react-bootstrap';
import { ArrowRight, Trash, Pencil, Plus, X } from 'react-bootstrap-icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import InitiativeDialog from './InitiativeDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import ConditionsMenu, { CONDITIONS } from './ConditionsMenu';
import action1 from '../assets/action-1.png';
import action2 from '../assets/action-2.png';
import action3 from '../assets/action-3.png';
import CreatureAttackForm from './CreatureAttackForm';

// Add PersistentDamageDialog component
function PersistentDamageDialog({ show, onHide, onConfirm, onCancel, damageType, damageValue }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Persistent Damage Check</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Did {damageType} persistent damage ({damageValue} damage) end?</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          No (Persists)
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Yes (Remove)
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function BattleTab({
  participants = [],
  onStartBattle,
  onFinishTurn,
  onEndBattle,
  onRemoveParticipant,
  onRemoveAllParticipants,
  onRemoveAllPlayers,
  onRemoveAllCreatures,
  battleStarted: isBattleStarted,
  currentTurn,
  currentRound,
  onUpdateParticipantHP,
  onUpdateBattleParticipant,
  onUpdateParticipantInitiative,
  initiativeTie,
  onResolveInitiativeTie,
  onInitiativeTie
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState(null);
  const [endBattleDialogOpen, setEndBattleDialogOpen] = useState(false);
  const [removeAllDialogOpen, setRemoveAllDialogOpen] = useState(false);
  const [editCreatureDialogOpen, setEditCreatureDialogOpen] = useState(false);
  const [creatureToEdit, setCreatureToEdit] = useState(null);
  const [editingInitiativeId, setEditingInitiativeId] = useState(null);
  const [initiativeInputValue, setInitiativeInputValue] = useState('');
  const [hpInputValues, setHpInputValues] = useState({});
  const [showConditionsMenu, setShowConditionsMenu] = useState(true);
  const [persistentDamageDialog, setPersistentDamageDialog] = useState({
    show: false,
    participantId: null,
    damageType: null,
    damageValue: null
  });

  const handleStartBattle = () => {
    if (participants.length > 0) {
      onStartBattle();
    }
  };

  const handleEndBattleClick = () => {
    setEndBattleDialogOpen(true);
  };

  const handleEndBattleConfirm = () => {
    onEndBattle();
    setEndBattleDialogOpen(false);
  };

  const handleEndBattleCancel = () => {
    setEndBattleDialogOpen(false);
  };

  const handleDeleteClick = (participant) => {
    setParticipantToDelete(participant);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (participantToDelete) {
      onRemoveParticipant(participantToDelete.battleId);
      setDeleteDialogOpen(false);
      setParticipantToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setParticipantToDelete(null);
  };

  const handleEditCreatureClick = (creature) => {
    setCreatureToEdit(creature);
    setEditCreatureDialogOpen(true);
  };

  const handleEditCreatureChange = (field, value) => {
    setCreatureToEdit(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditCreatureSave = () => {
    if (creatureToEdit && onUpdateBattleParticipant) {
      onUpdateBattleParticipant(creatureToEdit);
    }
    setEditCreatureDialogOpen(false);
    setCreatureToEdit(null);
  };

  const handleInitiativeClick = (participant) => {
    setEditingInitiativeId(participant.battleId);
    setInitiativeInputValue(participant.initiative !== null && participant.initiative !== undefined ? String(participant.initiative) : '');
  };

  const handleInitiativeChange = (e) => {
    setInitiativeInputValue(e.target.value);
  };

  const handleInitiativeBlurOrSave = (participant) => {
    const newValue = initiativeInputValue === '' ? null : Number(initiativeInputValue);
    if (onUpdateParticipantInitiative) {
      // Check for tie
      const tiedParticipants = participants.filter(p => p.battleId !== participant.battleId && p.initiative === newValue);
      if (tiedParticipants.length > 0) {
        // Use competitive selection modal for inline edit
        if (typeof onInitiativeTie === 'function') {
          // Set the tie state in the parent (App.jsx)
          onInitiativeTie({ participant, tiedParticipants, newValue, inline: true });
        }
      } else {
        console.log('Calling onUpdateParticipantInitiative with', participant.battleId, newValue);
        onUpdateParticipantInitiative(participant.battleId, newValue);
      }
    }
    // Only clear the input state after we've handled the update
    setEditingInitiativeId(null);
    setInitiativeInputValue('');
  };

  // Add effect to handle initiative tie resolution
  React.useEffect(() => {
    if (!initiativeTie) {
      // Clear initiative input state when tie is resolved
      setEditingInitiativeId(null);
      setInitiativeInputValue('');
    }
  }, [initiativeTie]);

  const handleHpInputChange = (battleId, value) => {
    setHpInputValues(prev => ({ ...prev, [battleId]: value }));
  };

  const handleHpDeduct = (participant) => {
    const value = Number(hpInputValues[participant.battleId]);
    if (!isNaN(value) && value !== 0) {
      if (onUpdateParticipantHP) {
        // Deduct from current HP only, do not change maxHp
        const newHp = Math.max(0, (Number(participant.hp) || 0) - value);
        onUpdateParticipantHP(participant.battleId, newHp);
      }
      setHpInputValues(prev => ({ ...prev, [participant.battleId]: '' }));
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const conditionId = result.draggableId;
    const targetParticipantId = String(result.destination.droppableId);

    console.log('Drag end:', {
      conditionId,
      targetParticipantId,
      destination: result.destination,
      draggableId: result.draggableId,
      source: result.source
    });

    if (targetParticipantId && conditionId) {
      handleConditionDrop(targetParticipantId, conditionId);
    }
  };

  const handleConditionDrop = (participantId, conditionId) => {
    console.log('Condition drop:', {
      participantId,
      conditionId,
      participants: participants.map(p => ({ id: p.battleId, name: p.name, type: typeof p.battleId }))
    });

    // Convert participantId to number for comparison
    const numericParticipantId = Number(participantId);
    const participant = participants.find(p => Number(p.battleId) === numericParticipantId);

    if (!participant) {
      console.log('Participant not found:', participantId, 'Available participants:', participants.map(p => ({ id: p.battleId, type: typeof p.battleId })));
      return;
    }

    // Find the condition by its ID directly
    const condition = Object.values(CONDITIONS).find(c => c.id === conditionId);
    if (!condition) {
      console.log('Condition not found:', conditionId, 'Available conditions:', Object.values(CONDITIONS).map(c => c.id));
      return;
    }

    console.log('Found condition:', condition);

    // Special handling for persistent damage
    if (conditionId === 'persistentDamage') {
      // Prompt for damage type and value
      const damageType = prompt('Enter damage type (e.g., fire, bleeding):');
      if (!damageType) return; // User cancelled

      const damageValue = prompt('Enter damage value:');
      if (!damageValue || isNaN(Number(damageValue))) {
        alert('Please enter a valid number for damage value');
        return;
      }

      // Get current instances or initialize empty array
      const currentInstances = participant.conditions?.persistentDamage?.instances || [];
      
      // Update participant with new condition instance
      const updatedParticipant = {
        ...participant,
        conditions: {
          ...participant.conditions,
          persistentDamage: {
            stacks: 1, // Keep track of total instances
            instances: [
              ...currentInstances,
              { damageType, damageValue: Number(damageValue) }
            ]
          }
        }
      };

      console.log('Updating participant with persistent damage:', {
        id: updatedParticipant.battleId,
        name: updatedParticipant.name,
        conditions: updatedParticipant.conditions
      });

      onUpdateBattleParticipant(updatedParticipant);
      return;
    }

    // Get current stacks of this condition
    const currentStacks = (participant.conditions?.[conditionId]?.stacks || 0);
    if (currentStacks >= condition.maxStacks) {
      console.log('Max stacks reached:', currentStacks);
      return;
    }

    // Update participant with new condition
    const updatedParticipant = {
      ...participant,
      conditions: {
        ...participant.conditions,
        [conditionId]: {
          stacks: currentStacks + 1,
          effects: condition.effects
        }
      }
    };

    console.log('Updating participant:', {
      id: updatedParticipant.battleId,
      name: updatedParticipant.name,
      conditions: updatedParticipant.conditions
    });

    // Helper function to modify damage expression
    const modifyDamageExpression = (damage, modifier) => {
      if (!damage) return damage;

      // Match patterns like "4d4+4" or "2d6+3" or "1d8"
      const match = damage.match(/^(\d+)d(\d+)(?:\+(\d+))?$/);
      if (!match) return damage;

      const [, dice, sides, bonus] = match;
      const newBonus = bonus ? Number(bonus) + modifier : modifier;

      // If the bonus becomes 0 or negative, just return the dice part
      if (newBonus <= 0) {
        return `${dice}d${sides}`;
      }

      return `${dice}d${sides}+${newBonus}`;
    };

    // Apply all condition effects
    Object.entries(condition.effects).forEach(([stat, value]) => {
      switch (stat) {
        case 'ac':
          updatedParticipant.ac = Math.max(0, (Number(updatedParticipant.ac) || 0) + value);
          break;
        case 'dc':
          updatedParticipant.dc = Math.max(0, (Number(updatedParticipant.dc) || 0) + value);
          break;
        case 'perception':
          updatedParticipant.perception = Math.max(0, (Number(updatedParticipant.perception) || 0) + value);
          break;
        case 'fortitude':
          updatedParticipant.fortitude = Math.max(0, (Number(updatedParticipant.fortitude) || 0) + value);
          break;
        case 'reflex':
          updatedParticipant.reflex = Math.max(0, (Number(updatedParticipant.reflex) || 0) + value);
          break;
        case 'will':
          updatedParticipant.will = Math.max(0, (Number(updatedParticipant.will) || 0) + value);
          break;
        case 'meleeFirstHitModifier':
        case 'meleeSecondHitModifier':
        case 'meleeThirdHitModifier': {
          if (updatedParticipant.attacks) {
            const which = stat.replace('melee', '').replace('Modifier', '');
            const key = which.charAt(0).toLowerCase() + which.slice(1) + 'Modifier';
            updatedParticipant.attacks = updatedParticipant.attacks.map(attack => {
              if ((attack.attackCategory === 'melee' || attack.attackType === 'melee')) {
                return {
                  ...attack,
                  [key]: Math.max(0, (Number(attack[key]) || 0) + value)
                };
              }
              return attack;
            });
          }
          break;
        }
        case 'rangedFirstHitModifier':
        case 'rangedSecondHitModifier':
        case 'rangedThirdHitModifier': {
          if (updatedParticipant.attacks) {
            const which = stat.replace('ranged', '').replace('Modifier', '');
            const key = which.charAt(0).toLowerCase() + which.slice(1) + 'Modifier';
            updatedParticipant.attacks = updatedParticipant.attacks.map(attack => {
              if ((attack.attackCategory === 'ranged' || attack.attackType === 'ranged')) {
                return {
                  ...attack,
                  [key]: Math.max(0, (Number(attack[key]) || 0) + value)
                };
              }
              return attack;
            });
          }
          break;
        }
        case 'spellFirstHitModifier':
        case 'spellSecondHitModifier':
        case 'spellThirdHitModifier': {
          if (updatedParticipant.attacks) {
            const which = stat.replace('spell', '').replace('Modifier', '');
            const key = which.charAt(0).toLowerCase() + which.slice(1) + 'Modifier';
            updatedParticipant.attacks = updatedParticipant.attacks.map(attack => {
              if ((attack.attackCategory === 'spell' || attack.attackType === 'spell')) {
                return {
                  ...attack,
                  [key]: Math.max(0, (Number(attack[key]) || 0) + value)
                };
              }
              return attack;
            });
          }
          break;
        }
        case 'meleeDamage':
          if (updatedParticipant.attacks) {
            updatedParticipant.attacks = updatedParticipant.attacks.map(attack => {
              // Only affect attacks that are strictly melee
              if ((attack.attackCategory && attack.attackCategory.toLowerCase() === 'melee') || (attack.attackType && attack.attackType.toLowerCase() === 'melee')) {
                return {
                  ...attack,
                  damage: modifyDamageExpression(attack.damage, value)
                };
              }
              return attack;
            });
          }
          break;
      }
    });

    // Special handling for Drained
    if (conditionId === 'drained') {
      // Store originalMaxHp if not present
      if (updatedParticipant.originalMaxHp === undefined) {
        updatedParticipant.originalMaxHp = Number(updatedParticipant.maxHp);
      }
      const stacks = updatedParticipant.conditions[conditionId].stacks;
      const level = Number(updatedParticipant.level) || 1;
      const reduction = stacks * level; // Deduct (stacks * level) HP
      // Calculate new max HP
      const newMaxHp = Math.max(0, updatedParticipant.originalMaxHp - reduction);
      // Calculate how much HP was reduced from max
      const maxHpReduction = updatedParticipant.originalMaxHp - newMaxHp;
      // Reduce current HP by the same amount
      const newCurrentHp = Math.max(0, Number(updatedParticipant.hp) - maxHpReduction);
      // Update both values
      updatedParticipant.maxHp = newMaxHp;
      updatedParticipant.hp = newCurrentHp;
    }

    console.log('Final participant update:', {
      id: updatedParticipant.battleId,
      name: updatedParticipant.name,
      ac: updatedParticipant.ac,
      conditions: updatedParticipant.conditions
    });

    onUpdateBattleParticipant(updatedParticipant);
  };

  const handleRemoveCondition = (participantId, conditionId, instance = null) => {
    const participant = participants.find(p => p.battleId === participantId);
    if (!participant || !participant.conditions?.[conditionId]) return;

    // Find condition by ID (try both formats)
    const condition = CONDITIONS[conditionId.toUpperCase().replace('-', '_')] ||
      Object.values(CONDITIONS).find(c => c.id === conditionId);
    if (!condition) {
      console.log('Condition not found for removal:', conditionId);
      return;
    }

    // Special handling for persistent damage instances
    if (conditionId === 'persistentDamage' && instance) {
      const updatedParticipant = { ...participant };
      const instances = updatedParticipant.conditions.persistentDamage.instances || [];
      const newInstances = instances.filter(i => 
        !(i.damageType === instance.damageType && i.damageValue === instance.damageValue)
      );

      if (newInstances.length === 0) {
        // Remove the entire condition if no instances remain
        const { persistentDamage, ...remainingConditions } = updatedParticipant.conditions;
        updatedParticipant.conditions = remainingConditions;
      } else {
        updatedParticipant.conditions.persistentDamage.instances = newInstances;
      }

      onUpdateBattleParticipant(updatedParticipant);
      return;
    }

    // Remove one stack of the condition
    const currentStacks = participant.conditions[conditionId].stacks;
    const updatedParticipant = { ...participant };

    if (currentStacks > 1) {
      // Reduce stacks
      updatedParticipant.conditions = {
        ...participant.conditions,
        [conditionId]: {
          ...participant.conditions[conditionId],
          stacks: currentStacks - 1
        }
      };
    } else {
      // Remove condition entirely
      const { [conditionId]: removed, ...remainingConditions } = participant.conditions;
      updatedParticipant.conditions = remainingConditions;
    }

    // Helper function to modify damage expression
    const modifyDamageExpression = (damage, modifier) => {
      if (!damage) return damage;

      // Match patterns like "4d4+4" or "2d6+3" or "1d8"
      const match = damage.match(/^(\d+)d(\d+)(?:\+(\d+))?$/);
      if (!match) return damage;

      const [, dice, sides, bonus] = match;
      const newBonus = bonus ? Number(bonus) - modifier : -modifier;

      // If the bonus becomes 0 or negative, just return the dice part
      if (newBonus <= 0) {
        return `${dice}d${sides}`;
      }

      return `${dice}d${sides}+${newBonus}`;
    };

    // Remove all condition effects
    Object.entries(condition.effects).forEach(([stat, value]) => {
      switch (stat) {
        case 'ac':
          updatedParticipant.ac = Math.max(0, (Number(updatedParticipant.ac) || 0) - value);
          break;
        case 'dc':
          updatedParticipant.dc = Math.max(0, (Number(updatedParticipant.dc) || 0) - value);
          break;
        case 'perception':
          updatedParticipant.perception = Math.max(0, (Number(updatedParticipant.perception) || 0) - value);
          break;
        case 'fortitude':
          updatedParticipant.fortitude = Math.max(0, (Number(updatedParticipant.fortitude) || 0) - value);
          break;
        case 'reflex':
          updatedParticipant.reflex = Math.max(0, (Number(updatedParticipant.reflex) || 0) - value);
          break;
        case 'will':
          updatedParticipant.will = Math.max(0, (Number(updatedParticipant.will) || 0) - value);
          break;
        case 'meleeFirstHitModifier':
        case 'meleeSecondHitModifier':
        case 'meleeThirdHitModifier': {
          if (updatedParticipant.attacks) {
            const which = stat.replace('melee', '').replace('Modifier', '');
            const key = which.charAt(0).toLowerCase() + which.slice(1) + 'Modifier';
            updatedParticipant.attacks = updatedParticipant.attacks.map(attack => {
              if ((attack.attackCategory === 'melee' || attack.attackType === 'melee')) {
                return {
                  ...attack,
                  [key]: Math.max(0, (Number(attack[key]) || 0) - value)
                };
              }
              return attack;
            });
          }
          break;
        }
        case 'rangedFirstHitModifier':
        case 'rangedSecondHitModifier':
        case 'rangedThirdHitModifier': {
          if (updatedParticipant.attacks) {
            const which = stat.replace('ranged', '').replace('Modifier', '');
            const key = which.charAt(0).toLowerCase() + which.slice(1) + 'Modifier';
            updatedParticipant.attacks = updatedParticipant.attacks.map(attack => {
              if ((attack.attackCategory === 'ranged' || attack.attackType === 'ranged')) {
                return {
                  ...attack,
                  [key]: Math.max(0, (Number(attack[key]) || 0) - value)
                };
              }
              return attack;
            });
          }
          break;
        }
        case 'spellFirstHitModifier':
        case 'spellSecondHitModifier':
        case 'spellThirdHitModifier': {
          if (updatedParticipant.attacks) {
            const which = stat.replace('spell', '').replace('Modifier', '');
            const key = which.charAt(0).toLowerCase() + which.slice(1) + 'Modifier';
            updatedParticipant.attacks = updatedParticipant.attacks.map(attack => {
              if ((attack.attackCategory === 'spell' || attack.attackType === 'spell')) {
                return {
                  ...attack,
                  [key]: Math.max(0, (Number(attack[key]) || 0) - value)
                };
              }
              return attack;
            });
          }
          break;
        }
        case 'meleeDamage':
          if (updatedParticipant.attacks) {
            updatedParticipant.attacks = updatedParticipant.attacks.map(attack => {
              // Only affect attacks that are strictly melee
              if ((attack.attackCategory && attack.attackCategory.toLowerCase() === 'melee') || (attack.attackType && attack.attackType.toLowerCase() === 'melee')) {
                return {
                  ...attack,
                  damage: modifyDamageExpression(attack.damage, value)
                };
              }
              return attack;
            });
          }
          break;
      }
    });

    // Special handling for Drained
    if (conditionId === 'drained') {
      if (updatedParticipant.originalMaxHp !== undefined) {
        const stacks = updatedParticipant.conditions[conditionId]?.stacks ? updatedParticipant.conditions[conditionId].stacks - 1 : 0;
        const level = Number(updatedParticipant.level) || 1;
        const reduction = stacks * level; // Deduct (stacks * level) HP
        // Calculate new max HP
        const newMaxHp = Math.max(0, updatedParticipant.originalMaxHp - reduction);
        // Calculate how much HP was reduced from max
        const maxHpReduction = updatedParticipant.originalMaxHp - newMaxHp;
        // Reduce current HP by the same amount
        const newCurrentHp = Math.max(0, Number(updatedParticipant.hp) - maxHpReduction);
        // Update both values
        updatedParticipant.maxHp = newMaxHp;
        updatedParticipant.hp = newCurrentHp;
        // If no more stacks, restore original max HP
        if (stacks <= 0) {
          updatedParticipant.maxHp = updatedParticipant.originalMaxHp;
          delete updatedParticipant.originalMaxHp;
        }
      }
    }

    console.log('Removing condition:', {
      participantId,
      conditionId,
      condition,
      updatedParticipant: {
        id: updatedParticipant.battleId,
        name: updatedParticipant.name,
        conditions: updatedParticipant.conditions
      }
    });

    onUpdateBattleParticipant(updatedParticipant);
  };

  // Move player with 0 HP before highest-initiative creature
  React.useEffect(() => {
    const playersWithZeroHP = participants.filter(p => p.type === 'player' && Number(p.hp) === 0);
    if (playersWithZeroHP.length > 0) {
      const creatures = participants.filter(p => p.type === 'creature');
      const highestCreature = creatures.reduce((max, c) => (c.initiative > (max?.initiative || -Infinity) ? c : max), null);
      if (highestCreature) {
        const others = participants.filter(p => p.battleId !== highestCreature.battleId && !(p.type === 'player' && Number(p.hp) === 0));
        const reordered = [
          ...others,
          ...playersWithZeroHP,
          highestCreature
        ];
        // setBattleParticipants(reordered); // Not needed, handled in App
      }
    }
  }, [participants]);

  React.useEffect(() => {
    const handler = (e) => {
      if (e.detail) {
        if (typeof window.addBattleParticipant === 'function') {
          window.addBattleParticipant(e.detail);
        }
      }
    };
    window.addEventListener('addBattleParticipant', handler);
    return () => window.removeEventListener('addBattleParticipant', handler);
  }, []);

  React.useEffect(() => {
    window.updateBattleParticipantInitiative = (battleId, newInitiative) => {
      if (!battleId) return;
      // Update in App state
      if (typeof window.setBattleParticipants === 'function') {
        window.setBattleParticipants(prev => prev.map(p => p.battleId === battleId ? { ...p, initiative: newInitiative } : p));
      }
    };
    return () => { window.updateBattleParticipantInitiative = undefined; };
  }, []);

  // Helper function to check if a stat is affected by conditions (optionally for a specific attack)
  const isStatAffectedByConditions = (participant, stat, attack = null) => {
    if (!participant.conditions) return false;
    return Object.entries(participant.conditions).some(([conditionId, data]) => {
      const condition = CONDITIONS[conditionId.toUpperCase().replace('-', '_')] ||
        Object.values(CONDITIONS).find(c => c.id === conditionId);
      if (!condition) return false;
      // For attack modifiers, check for per-type keys
      if ((stat === 'firstHitModifier' || stat === 'secondHitModifier' || stat === 'thirdHitModifier') && attack) {
        const type = (attack.attackCategory || attack.attackType || '').toLowerCase();
        let effectKey = '';
        if (type === 'melee') effectKey = 'melee' + stat.charAt(0).toUpperCase() + stat.slice(1);
        else if (type === 'ranged') effectKey = 'ranged' + stat.charAt(0).toUpperCase() + stat.slice(1);
        else if (type === 'spell') effectKey = 'spell' + stat.charAt(0).toUpperCase() + stat.slice(1);
        if (effectKey && effectKey in condition.effects) return true;
      }
      // For damage, only highlight if the condition affects the correct type
      if (stat === 'meleeDamage' && attack) {
        const type = (attack.attackCategory || attack.attackType || '').toLowerCase();
        if (type === 'melee' && 'meleeDamage' in condition.effects) return true;
        if (type === 'ranged' && 'rangedDamage' in condition.effects) return true;
        if (type === 'spell' && 'spellDamage' in condition.effects) return true;
      }
      // Check if the condition affects this stat (for non-attack stats)
      if (stat === 'ac' && 'ac' in condition.effects) return true;
      if (stat === 'dc' && 'dc' in condition.effects) return true;
      if (stat === 'perception' && 'perception' in condition.effects) return true;
      if (stat === 'fortitude' && 'fortitude' in condition.effects) return true;
      if (stat === 'reflex' && 'reflex' in condition.effects) return true;
      if (stat === 'will' && 'will' in condition.effects) return true;
      return false;
    });
  };

  // Helper function to render a stat with conditional styling (optionally for a specific attack)
  const renderStat = (participant, stat, value, attack = null) => {
    const isAffected = isStatAffectedByConditions(participant, stat, attack);
    if (value === null || value === undefined || value === '' || (typeof value !== 'string' && typeof value !== 'number')) {
      return <span>—</span>;
    }
    return (
      <span style={{ color: isAffected ? 'red' : 'inherit' }}>
        {value}
      </span>
    );
  };

  // Helper function to render attack modifiers
  const renderAttackModifiers = (participant, attack) => {
    const modifiers = [
      attack.firstHitModifier,
      attack.secondHitModifier,
      attack.thirdHitModifier
    ].filter(mod => mod !== null && mod !== undefined && mod !== '');

    if (modifiers.length === 0) return null;

    return modifiers.map((mod, index) => (
      <React.Fragment key={index}>
        {renderStat(participant, ['firstHitModifier', 'secondHitModifier', 'thirdHitModifier'][index], mod, attack)}
        {index < modifiers.length - 1 ? '/' : ''}
      </React.Fragment>
    ));
  };

  // Helper function to render damage
  const renderDamage = (participant, attack) => {
    if (!attack.damage) return null;
    return (
      <span>
        {' ('}
        {renderStat(participant, 'meleeDamage', attack.damage, attack)}
        {')'}
      </span>
    );
  };

  // Helper to safely get a numeric/string attack modifier for spells
  const getSpellAttackModifier = atk => {
    let result = '—';
    if (typeof atk.firstHitModifier === 'number' || typeof atk.firstHitModifier === 'string') {
      result = atk.firstHitModifier;
    } else if (typeof atk.attackModifier === 'number' || typeof atk.attackModifier === 'string') {
      result = atk.attackModifier;
    } else if (atk.attackModifier && typeof atk.attackModifier === 'object') {
      if ('value' in atk.attackModifier && (typeof atk.attackModifier.value === 'number' || typeof atk.attackModifier.value === 'string')) {
        result = atk.attackModifier.value;
      } else if ('modifier' in atk.attackModifier && (typeof atk.attackModifier.modifier === 'number' || typeof atk.attackModifier.modifier === 'string')) {
        result = atk.attackModifier.modifier;
      } else {
        for (const key in atk.attackModifier) {
          if (typeof atk.attackModifier[key] === 'number' || typeof atk.attackModifier[key] === 'string') {
            result = atk.attackModifier[key];
            break;
          }
        }
      }
    }
    console.log('Spell attack modifier for', atk.attackName, ':', result, 'typeof:', typeof result);
    return result;
  };

  // Add function to handle persistent damage application
  const handlePersistentDamage = (participant) => {
    if (!participant.conditions?.persistentDamage) return;

    // Get all persistent damage instances
    const persistentDamageInstances = participant.conditions.persistentDamage.instances || [];
    
    // Apply damage for each instance
    let totalDamage = 0;
    persistentDamageInstances.forEach(instance => {
      totalDamage += instance.damageValue;
    });

    // Apply total damage
    if (totalDamage > 0 && onUpdateParticipantHP) {
      const newHp = Math.max(0, Number(participant.hp) - totalDamage);
      onUpdateParticipantHP(participant.battleId, newHp);
    }

    // Show removal check dialog for each instance
    if (persistentDamageInstances.length > 0) {
      const firstInstance = persistentDamageInstances[0];
      setPersistentDamageDialog({
        show: true,
        participantId: participant.battleId,
        damageType: firstInstance.damageType,
        damageValue: firstInstance.damageValue,
        remainingInstances: persistentDamageInstances.slice(1)
      });
    }
  };

  // Add function to handle persistent damage removal check
  const handlePersistentDamageCheck = (shouldRemove) => {
    const { participantId, damageType, damageValue, remainingInstances } = persistentDamageDialog;
    const participant = participants.find(p => p.battleId === participantId);
    
    if (!participant) return;

    if (shouldRemove) {
      // Remove this instance of persistent damage
      const updatedParticipant = { ...participant };
      const instances = updatedParticipant.conditions.persistentDamage.instances || [];
      const newInstances = instances.filter(instance => 
        !(instance.damageType === damageType && instance.damageValue === damageValue)
      );

      if (newInstances.length === 0) {
        // Remove the entire condition if no instances remain
        const { persistentDamage, ...remainingConditions } = updatedParticipant.conditions;
        updatedParticipant.conditions = remainingConditions;
      } else {
        updatedParticipant.conditions.persistentDamage.instances = newInstances;
      }

      onUpdateBattleParticipant(updatedParticipant);
    }

    // Show dialog for next instance if any remain
    if (remainingInstances && remainingInstances.length > 0) {
      const nextInstance = remainingInstances[0];
      setPersistentDamageDialog({
        show: true,
        participantId,
        damageType: nextInstance.damageType,
        damageValue: nextInstance.damageValue,
        remainingInstances: remainingInstances.slice(1)
      });
    } else {
      setPersistentDamageDialog({ show: false });
    }
  };

  // Modify handleFinishTurn to apply persistent damage
  const handleFinishTurn = () => {
    if (onFinishTurn) {
      const currentParticipant = participants.find(p => p.battleId === currentTurn);
      if (currentParticipant) {
        handlePersistentDamage(currentParticipant);
      }
      onFinishTurn();
    }
  };

  // Add effect to handle persistent damage at start of round
  React.useEffect(() => {
    if (isBattleStarted && currentRound > 0) {
      // Find the participant with the current turn
      const currentParticipant = participants.find(p => p.battleId === currentTurn);
      if (currentParticipant) {
        handlePersistentDamage(currentParticipant);
      }
    }
  }, [currentRound, isBattleStarted, currentTurn]);

  return (
    <StrictMode>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Container fluid>
          <Row>
            <Col md={showConditionsMenu ? 9 : 12}>
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-3">
                    <h5 className="mb-0">Battle</h5>
                    <span className="badge bg-secondary">Round: {currentRound}</span>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setShowConditionsMenu(!showConditionsMenu)}
                    >
                      {showConditionsMenu ? 'Hide' : 'Show'} Conditions Menu
                    </Button>
                    {!isBattleStarted ? (
                      <Button
                        variant="primary"
                        onClick={handleStartBattle}
                        disabled={participants.length === 0}
                      >
                        Start Battle
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="primary"
                          onClick={handleFinishTurn}
                        >
                          Finish Turn <ArrowRight />
                        </Button>
                        <Button
                          variant="danger"
                          onClick={handleEndBattleClick}
                        >
                          Finish Battle
                        </Button>
                      </>
                    )}
                    {!isBattleStarted && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => setRemoveAllDialogOpen(true)}
                      >
                        <Trash /> Remove All
                      </Button>
                    )}
                  </div>
                </Card.Header>
                <ListGroup variant="flush">
                  {participants.map((participant) => (
                    <Droppable
                      key={participant.battleId}
                      droppableId={String(participant.battleId)}
                      isDropDisabled={!isBattleStarted}
                    >
                      {(provided, snapshot) => (
                        <ListGroupItem
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`d-flex justify-content-between align-items-center ${currentTurn === participant.battleId ? 'highlighted-turn' : ''
                            } ${Number(participant.hp) <= 0 ? 'hp-below-zero' : ''
                            } ${currentTurn === participant.battleId && Number(participant.hp) <= 0 ? 'hp-below-zero-highlighted' : ''
                            } ${snapshot.isDraggingOver ? 'droppable-active' : ''}`}
                        >
                          <div className="d-flex flex-column flex-grow-1">
                            <div>
                              <strong>{participant.name}</strong>
                              {editingInitiativeId === participant.battleId ? (
                                <input
                                  type="number"
                                  className="form-control d-inline-block ms-2"
                                  style={{ width: 80, height: 30, fontSize: '0.9rem' }}
                                  value={initiativeInputValue}
                                  autoFocus
                                  onChange={handleInitiativeChange}
                                  onBlur={() => handleInitiativeBlurOrSave(participant)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleInitiativeBlurOrSave(participant);
                                  }}
                                />
                              ) : (
                                <Badge
                                  bg="dark"
                                  className="ms-2 text-white"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => handleInitiativeClick(participant)}
                                  title="Click to edit initiative"
                                >
                                  Initiative: {participant.initiative !== null && participant.initiative !== undefined && participant.initiative !== '' ? participant.initiative : '—'}
                                </Badge>
                              )}
                            </div>
                            <div className="small text-muted mt-1">
                              {participant.type === 'creature' ? (
                                <>

                                  <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                                    HP: {participant.hp} / {participant.maxHp !== undefined && participant.maxHp !== '' ? participant.maxHp : participant.hp}
                                    
                                    <input
                                      type="number"
                                      className="form-control d-inline-block ms-2"
                                      style={{ width: 60, height: 32, fontSize: '0.9rem', padding: '2px 8px' }}
                                      value={hpInputValues[participant.battleId] || ''}
                                      onChange={e => handleHpInputChange(participant.battleId, e.target.value)}
                                      placeholder="DMG"
                                    />
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      className="ms-1"
                                      style={{ height: 32, width: 40, padding: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                      onClick={() => handleHpDeduct(participant)}
                                      disabled={!hpInputValues[participant.battleId] || isNaN(Number(hpInputValues[participant.battleId]))}
                                    >
                                      -
                                    </Button>
                                  </div>
                                  <div>
                                    AC: {renderStat(participant, 'ac', participant.ac)}
                                    <span className="ms-2">
                                    Level: {renderStat(participant, 'level', participant.level)}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                                      Fortitude: {renderStat(participant, 'fortitude', participant.fortitude)}
                                      <span className="ms-2">
                                        Reflex: {renderStat(participant, 'reflex', participant.reflex)}
                                      </span>
                                      Will: {renderStat(participant, 'will', participant.will)}
                                    </div>
                                  </div>

                                  {participant.attacks && Array.isArray(participant.attacks) && participant.attacks.length > 0 && (
                                    <div>
                                      {/* Melee Attacks Section */}
                                      {participant.attacks.some(atk => (atk.attackCategory || atk.attackType) === 'melee') && (
                                        <div className="mt-2">
                                          <strong>Melee Attacks:</strong>
                                          <ul className="mb-0 ps-3">
                                            {participant.attacks.filter(atk => (atk.attackCategory || atk.attackType) === 'melee').map((atk, i) => (
                                              atk.attackName ? (
                                                <li key={i} style={{ listStyleType: 'disc' }}>
                                                  {atk.attackName} {renderAttackModifiers(participant, atk)}
                                                  {renderDamage(participant, atk)}
                                                </li>
                                              ) : null
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {/* Ranged Attacks Section */}
                                      {participant.attacks.some(atk => (atk.attackCategory || atk.attackType) === 'ranged') && (
                                        <div className="mt-2">
                                          <strong>Ranged Attacks:</strong>
                                          <ul className="mb-0 ps-3">
                                            {participant.attacks.filter(atk => (atk.attackCategory || atk.attackType) === 'ranged').map((atk, i) => (
                                              atk.attackName ? (
                                                <li key={i} style={{ listStyleType: 'disc' }}>
                                                  {atk.attackName} {renderAttackModifiers(participant, atk)}
                                                  {renderDamage(participant, atk)}
                                                </li>
                                              ) : null
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {/* Spell Attacks Section */}
                                      {participant.attacks.some(atk => (atk.attackCategory || atk.attackType) === 'spell') && (
                                        <div className="mt-2">
                                          <strong>Spells:</strong>
                                          <ul className="mb-0 ps-3">
                                            {participant.attacks.filter(atk => (atk.attackCategory || atk.attackType) === 'spell').map((atk, i) => (
                                              atk.attackName ? (
                                                <li key={i} style={{ listStyleType: 'disc' }}>
                                                  <span className="text-muted"></span> {atk.attackName}
                                                  <span>
                                                    {/* Actions icon */}
                                                    {(() => {
                                                      let icon = null;
                                                      if (atk.actions === '1') icon = action1;
                                                      else if (atk.actions === '2') icon = action2;
                                                      else if (atk.actions === '3') icon = action3;
                                                      if (icon) {
                                                        return (
                                                          <img
                                                            src={icon}
                                                            alt={`${atk.actions} action(s)`}
                                                            style={{ height: '1.2em', verticalAlign: 'middle', marginLeft: 8, marginRight: 4 }}
                                                          />
                                                        );
                                                      }
                                                      return null;
                                                    })()}
                                                    {atk.targetOrArea === 'target' && atk.targetCount && `, Targets: ${atk.targetCount}`}
                                                    {atk.targetOrArea === 'area' && atk.areaType && `, Area: ${atk.areaType}`}
                                                    {atk.range && `, Range: ${atk.range}`}
                                                    {/* FIXED SPELL ATTACK MODIFIER DISPLAY */}
                                                    {(() => {
                                                      if (atk.attackOrSave === 'attack') {
                                                        // console.log('Rendering spell attack:', atk);
                                                        let mod = atk.attackModifier;
                                                        if (mod && typeof mod === 'object') {
                                                          if ('value' in mod && (typeof mod.value === 'number' || typeof mod.value === 'string')) mod = mod.value;
                                                          else if ('modifier' in mod && (typeof mod.modifier === 'number' || typeof mod.modifier === 'string')) mod = mod.modifier;
                                                          else {
                                                            for (const key in mod) {
                                                              if (typeof mod[key] === 'number' || typeof mod[key] === 'string') {
                                                                mod = mod[key];
                                                                break;
                                                              }
                                                            }
                                                          }
                                                        }
                                                        if (mod === undefined || mod === null || mod === '' || (typeof mod !== 'string' && typeof mod !== 'number')) mod = '—';
                                                        return [', Attack Modifier: ', renderStat(participant, 'firstHitModifier', mod, atk)];
                                                      }
                                                      return null;
                                                    })()}
                                                    {atk.attackOrSave === 'save' && `, Save: ${atk.saveType || ''} DC ${renderStat(participant, 'dc', atk.attackModifier)}`}
                                                    {atk.damage && [', Damage: ', renderStat(participant, 'meleeDamage', atk.damage, atk)]}
                                                  </span>
                                                </li>
                                              ) : null
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {/* Regular Spells Section */}
                                      {participant.attacks.some(atk => (atk.attackCategory || atk.attackType) === 'regularSpell') && (
                                        <div className="mt-2">
                                          <strong>Regular Spells:</strong>
                                          <ul className="mb-0 ps-3">
                                            {participant.attacks.filter(atk => (atk.attackCategory || atk.attackType) === 'regularSpell').map((atk, i) => (
                                              <li key={i} style={{ listStyleType: 'circle' }}>
                                                <span className="text-muted">[regular spell]</span>
                                                {atk.attackName && <strong style={{ marginLeft: 4 }}>{atk.attackName}</strong>}
                                                {(() => {
                                                  let icon = null;
                                                  if (atk.actions === '1') icon = action1;
                                                  else if (atk.actions === '2') icon = action2;
                                                  else if (atk.actions === '3') icon = action3;
                                                  if (icon) {
                                                    return (
                                                      <img
                                                        src={icon}
                                                        alt={`${atk.actions} action(s)`}
                                                        style={{ height: '1.2em', verticalAlign: 'middle', marginLeft: 8, marginRight: 4 }}
                                                      />
                                                    );
                                                  }
                                                  return null;
                                                })()}
                                                {atk.range && `, Range: ${atk.range}`}
                                                {atk.targets && `, Targets: ${atk.targets}`}
                                                {atk.duration && `, Duration: ${atk.duration}`}
                                                {atk.description && (
                                                  <div style={{ marginLeft: 24, marginTop: 2 }}>{atk.description}</div>
                                                )}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                </>
                              ) : (
                                <div className="d-flex align-items-center">
                                  <div>
                                    HP: {participant.hp} / {participant.maxHp !== undefined && participant.maxHp !== '' ? participant.maxHp : participant.hp}
                                    <span className="ms-2">AC: {renderStat(participant, 'ac', participant.ac || 0)}</span>
                                  </div>
                                  <div className="d-flex align-items-center"><input
                                    type="number"
                                    className="form-control d-inline-block ms-2"
                                    style={{ width: 60, height: 32, fontSize: '0.9rem', padding: '2px 8px' }}
                                    value={hpInputValues[participant.battleId] || ''}
                                    onChange={e => handleHpInputChange(participant.battleId, e.target.value)}
                                    placeholder="DMG"
                                  />
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      className="ms-1"
                                      style={{ height: 32, width: 40, padding: 0, fontSize: '1.2rem', alignItems: 'center', justifyContent: 'center' }}
                                      onClick={() => handleHpDeduct(participant)}
                                      disabled={!hpInputValues[participant.battleId] || isNaN(Number(hpInputValues[participant.battleId]))}
                                    >
                                      -
                                    </Button>
                                  </div>
                                  <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                                    Level:
                                  </div>
                                </div>
                              )}
                            </div>
                            {participant.conditions && Object.entries(participant.conditions).length > 0 && (
                              <div className="mt-2">
                                <strong>Conditions:</strong>
                                <div className="d-flex flex-wrap gap-1 mt-1">
                                  {Object.entries(participant.conditions).map(([conditionId, data]) => {
                                    // Find condition by ID (try both formats)
                                    const condition = CONDITIONS[conditionId.toUpperCase().replace('-', '_')] ||
                                      Object.values(CONDITIONS).find(c => c.id === conditionId);
                                    if (!condition) return null;

                                    // Special handling for persistent damage
                                    if (conditionId === 'persistentDamage' && data.instances) {
                                      return data.instances.map((instance, index) => (
                                        <Badge
                                          key={`${conditionId}-${index}`}
                                          bg="secondary"
                                          className="d-flex align-items-center"
                                          style={{ cursor: 'pointer' }}
                                        >
                                          {condition.name} ({instance.damageType}, {instance.damageValue})
                                          <Button
                                            variant="light"
                                            size="sm"
                                            className="ms-1 py-0 px-1"
                                            style={{ lineHeight: 1, fontSize: '0.9em' }}
                                            onClick={e => { e.stopPropagation(); handleRemoveCondition(participant.battleId, conditionId, instance); }}
                                            title="Remove instance"
                                          >
                                            <X />
                                          </Button>
                                        </Badge>
                                      ));
                                    }

                                    return (
                                      <Badge
                                        key={conditionId}
                                        bg="secondary"
                                        className="d-flex align-items-center"
                                        style={{ cursor: 'pointer' }}
                                      >
                                        {condition.name} ({data.stacks})
                                        <Button
                                          variant="light"
                                          size="sm"
                                          className="ms-1 py-0 px-1"
                                          style={{ lineHeight: 1, fontSize: '0.9em' }}
                                          onClick={e => { e.stopPropagation(); handleConditionDrop(participant.battleId, conditionId); }}
                                          title="Add stack"
                                        >
                                          +
                                        </Button>
                                        <Button
                                          variant="light"
                                          size="sm"
                                          className="ms-1 py-0 px-1"
                                          style={{ lineHeight: 1, fontSize: '0.9em' }}
                                          onClick={e => { e.stopPropagation(); handleRemoveCondition(participant.battleId, conditionId); }}
                                          title="Remove stack"
                                        >
                                          -
                                        </Button>
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {isBattleStarted && !showConditionsMenu && (
                              <div className="mt-2">
                                <div className="d-flex align-items-center gap-2">
                                  <select
                                    className="form-select form-select-sm"
                                    style={{ width: 'auto' }}
                                    onChange={(e) => {
                                      const conditionId = e.target.value;
                                      if (conditionId) {
                                        handleConditionDrop(participant.battleId, conditionId);
                                        e.target.value = ''; // Reset selection
                                      }
                                    }}
                                  >
                                    <option value="">Add Condition...</option>
                                    {Object.values(CONDITIONS).map((condition) => (
                                      <option key={condition.id} value={condition.id}>
                                        {condition.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="d-flex gap-2 ms-auto">
                            <Button
                              variant={currentTurn === participant.battleId ? "light" : "outline-danger"}
                              size="sm"
                              onClick={() => handleDeleteClick(participant)}
                            >
                              <Trash />
                            </Button>
                            {participant.type === 'creature' && (
                              <Button
                                variant={currentTurn === participant.battleId ? "light" : "outline-primary"}
                                size="sm"
                                className="ms-1"
                                onClick={() => handleEditCreatureClick(participant)}
                              >
                                <Pencil />
                              </Button>
                            )}
                          </div>
                          {provided.placeholder}
                        </ListGroupItem>
                      )}
                    </Droppable>
                  ))}
                </ListGroup>
              </Card>
            </Col>
            {showConditionsMenu && (
              <Col md={3}>
                <ConditionsMenu isBattleStarted={isBattleStarted} />
              </Col>
            )}
          </Row>

          <DeleteConfirmationDialog
            open={deleteDialogOpen}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            title="Remove Participant"
            message={`Are you sure you want to remove ${participantToDelete?.name || 'this participant'} from the battle?`}
          />

          <DeleteConfirmationDialog
            open={endBattleDialogOpen}
            onClose={handleEndBattleCancel}
            onConfirm={handleEndBattleConfirm}
            title="End Battle"
            message="Are you sure you want to end the battle? This will clear all participants and reset the battle state."
          />

          <DeleteConfirmationDialog
            open={removeAllDialogOpen}
            onClose={() => setRemoveAllDialogOpen(false)}
            onConfirm={() => { setRemoveAllDialogOpen(false); onRemoveAllParticipants(); }}
            title="Remove All Participants"
            message="Are you sure you want to remove all participants from the battle? This action cannot be undone."
          />

          {editCreatureDialogOpen && creatureToEdit && (
            <div className="modal show fade d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Edit Creature</h5>
                    <button type="button" className="btn-close" onClick={() => setEditCreatureDialogOpen(false)}></button>
                  </div>
                  <div className="modal-body">
                    <form onSubmit={e => { e.preventDefault(); handleEditCreatureSave(); }}>
                      <div className="row">
                        <div className="col-md-8">
                          <label className="form-label">Creature Name</label>
                          <input type="text" className="form-control" value={creatureToEdit.name} onChange={e => handleEditCreatureChange('name', e.target.value)} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Perception</label>
                          <input type="text" className="form-control" value={creatureToEdit.perception} onChange={e => handleEditCreatureChange('perception', e.target.value)} />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label">HP</label>
                          <input type="number" className="form-control" value={creatureToEdit.maxHp} onChange={e => handleEditCreatureChange('maxHp', e.target.value)} />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">AC</label>
                          <input type="number" className="form-control" value={creatureToEdit.ac} onChange={e => handleEditCreatureChange('ac', e.target.value)} />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">DC</label>
                          <input type="number" className="form-control" value={creatureToEdit.dc} onChange={e => handleEditCreatureChange('dc', e.target.value)} />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Fortitude</label>
                          <input type="number" className="form-control" value={creatureToEdit.fortitude} onChange={e => handleEditCreatureChange('fortitude', e.target.value)} />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Reflex</label>
                          <input type="number" className="form-control" value={creatureToEdit.reflex} onChange={e => handleEditCreatureChange('reflex', e.target.value)} />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Will</label>
                          <input type="number" className="form-control" value={creatureToEdit.will} onChange={e => handleEditCreatureChange('will', e.target.value)} />
                        </div>
                      </div>
                      {/* <div className="mb-3">
                        <label className="form-label">Penalty</label>
                        <input type="number" className="form-control" value={creatureToEdit.penalty || ''} onChange={e => handleEditCreatureChange('penalty', e.target.value)} />
                      </div> */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0">Attacks</h6>
                        </div>
                        <CreatureAttackForm
                          attacks={creatureToEdit.attacks || []}
                          onChange={attacks => setCreatureToEdit(prev => ({ ...prev, attacks }))}
                          onAddAttack={type => setCreatureToEdit(prev => ({ ...prev, attacks: [...(prev.attacks || []), type === 'spell' ? { attackName: '', attackType: 'spell', tradition: [], actions: '1', targetOrArea: 'target', areaType: '', range: '' } : type === 'regularSpell' ? { attackName: '', attackType: 'regularSpell', actions: '1', range: '', targets: '', duration: '', description: '' } : { attackName: '', attackType: type, firstHitModifier: '', secondHitModifier: '', thirdHitModifier: '', damage: '' }] }))}
                          onRemoveAttack={index => setCreatureToEdit(prev => ({ ...prev, attacks: prev.attacks.filter((_, i) => i !== index) }))}
                        />
                      </div>
                      <div className="d-flex gap-2 justify-content-end">
                        <Button variant="secondary" onClick={() => setEditCreatureDialogOpen(false)} type="button">Cancel</Button>
                        <Button variant="primary" type="submit">Save</Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Initiative tie modal for both inline and start battle */}
          {(initiativeTie && onResolveInitiativeTie) ? (
            <div className="modal show fade d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Initiative Tie</h5>
                    <button type="button" className="btn-close" onClick={() => onResolveInitiativeTie(null)}></button>
                  </div>
                  <div className="modal-body">
                    <p>
                      Multiple participants have initiative <strong>{initiativeTie.newValue}</strong>.<br />
                      Who should go first?
                    </p>
                    <ul>
                      {[initiativeTie.participant, ...initiativeTie.tiedParticipants].map(p => (
                        <li key={p.battleId}>
                          <Button variant="outline-primary" onClick={() => onResolveInitiativeTie(p.battleId)}>
                            {p.name}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="modal-footer">
                    <Button variant="secondary" onClick={() => onResolveInitiativeTie(null)}>Cancel</Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <PersistentDamageDialog
            show={persistentDamageDialog.show}
            onHide={() => setPersistentDamageDialog({ show: false })}
            onConfirm={() => handlePersistentDamageCheck(true)}
            onCancel={() => handlePersistentDamageCheck(false)}
            damageType={persistentDamageDialog.damageType}
            damageValue={persistentDamageDialog.damageValue}
          />
        </Container>
      </DragDropContext>
    </StrictMode>
  );
}

export default BattleTab; 
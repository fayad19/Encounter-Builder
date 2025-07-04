import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, ListGroupItem, Badge, Modal } from 'react-bootstrap';
import { ArrowRight, Trash, Pencil, Plus, X } from 'react-bootstrap-icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import InitiativeDialog from './InitiativeDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import ConditionsMenu, { CONDITIONS } from './ConditionsMenu';
import CreatureAttackForm from './CreatureAttackForm';
import CreatureActionForm from './CreatureActionForm';
import CreatureCard from './CreatureCard';
import PlayerCard from './PlayerCard';
import { calculateCurrentResistances } from '../utils/creatureConversion';
import quickRefData from '../data/quickRef.json';
import CreatureSkillsForm from './CreatureSkillsForm';

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

// Add this helper function before the BattleTab function
function renderSpellDescription(rawDescription) {
  if (!rawDescription) return null;
  // Replace @UUID[...] with the text inside {...}
  let processed = rawDescription.replace(/@UUID\[[^\]]*\]\{([^}]*)\}/g, '$1');
  // Bold the keywords at the start of lines or after <p>
  processed = processed.replace(/(>|^)(Critical Success|Success|Failure|Critical Failure)(:|\s)/g, (match, p1, p2, p3) => `${p1}<strong>${p2}</strong>${p3}`);
  // If it doesn't look like HTML, add <p> for each line
  if (!/<[a-z][\s\S]*>/i.test(processed)) {
    processed = processed
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p>${line}</p>`)
      .join('');
  }
  // Add linkifyConditions logic
  processed = linkifyConditions(processed);
  return <div dangerouslySetInnerHTML={{ __html: processed }} />;
}

// Helper: Map condition names to quickRefData Conditions
const conditionList = quickRefData.find(q => q.name === 'Conditions')?.list || [];
function linkifyConditions(text) {
  if (!text) return text;
  return text.replace(/@UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z]+)](\{([^}]+)\})?/g, (match, cond, _, label) => {
    const condName = (label || cond).replace(/-/g, ' ');
    const found = conditionList.find(c => c.name.toLowerCase() === condName.toLowerCase());
    if (found) {
      return `<a href='#' class='condition-link' data-condition='${found.name}'>${found.name}</a>`;
    } else {
      return label || cond;
    }
  });
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
  const [editPlayerDialogOpen, setEditPlayerDialogOpen] = useState(false);
  const [creatureToEdit, setCreatureToEdit] = useState(null);
  const [playerToEdit, setPlayerToEdit] = useState(null);
  const [editingInitiativeId, setEditingInitiativeId] = useState(null);
  const [initiativeInputValue, setInitiativeInputValue] = useState('');
  const [hpInputValues, setHpInputValues] = useState({});
  const [tempHpInputValues, setTempHpInputValues] = useState({});
  const [showConditionsMenu, setShowConditionsMenu] = useState(true);
  const [expandedSpells, setExpandedSpells] = useState({});
  const [expandedAttacks, setExpandedAttacks] = useState({});
  const [persistentDamageDialog, setPersistentDamageDialog] = useState({
    show: false,
    participantId: null,
    damageType: null,
    damageValue: null
  });
  // Add state for showing condition modal
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [conditionModalData, setConditionModalData] = useState(null);
  const [weakDialogOpen, setWeakDialogOpen] = useState(false);
  const [creatureToWeak, setCreatureToWeak] = useState(null);
  const [eliteDialogOpen, setEliteDialogOpen] = useState(false);
  const [creatureToElite, setCreatureToElite] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const activeParticipantRef = useRef(null);
  // Add state to track pending persistent damage checks
  const [pendingPersistentDamageCheck, setPendingPersistentDamageCheck] = useState(null);

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
    if (field === 'skills') {
      // Special handling for skills to ensure we're updating the entire skills object
      setCreatureToEdit(prev => ({
        ...prev,
        skills: value
      }));
    } else {
      setCreatureToEdit(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleEditCreatureSave = () => {
    if (creatureToEdit && onUpdateBattleParticipant) {
      onUpdateBattleParticipant(creatureToEdit);
    }
    setEditCreatureDialogOpen(false);
    setCreatureToEdit(null);
  };

  const handleEditPlayerClick = (player) => {
    setPlayerToEdit(player);
    setEditPlayerDialogOpen(true);
  };

  const handleEditPlayerChange = (field, value) => {
    setPlayerToEdit(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditPlayerSave = () => {
    if (playerToEdit && onUpdateBattleParticipant) {
      onUpdateBattleParticipant(playerToEdit);
    }
    setEditPlayerDialogOpen(false);
    setPlayerToEdit(null);
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
  useEffect(() => {
    if (!initiativeTie) {
      // Clear initiative input state when tie is resolved
      setEditingInitiativeId(null);
      setInitiativeInputValue('');
    }
  }, [initiativeTie]);

  const handleHpInputChange = (battleId, value) => {
    setHpInputValues(prev => ({ ...prev, [battleId]: value }));
  };

  const handleTempHpInputChange = (battleId, value) => {
    setTempHpInputValues(prev => ({ ...prev, [battleId]: value }));
  };

  const handleHpSubtract = (participant) => {
    const value = Number(hpInputValues[participant.battleId]);
    if (!isNaN(value) && value !== 0) {
      if (onUpdateParticipantHP) {
        // Use the new damage handling function that considers temp HP
        if (typeof window.handleParticipantDamage === 'function') {
          window.handleParticipantDamage(participant.battleId, value);
        } else {
          // Fallback to old behavior if new function not available
          const newHp = Math.max(0, (Number(participant.hp) || 0) - value);
          onUpdateParticipantHP(participant.battleId, newHp);
        }
      }
      setHpInputValues(prev => ({ ...prev, [participant.battleId]: '' }));
    }
  };

  const handleHpAdd = (participant) => {
    const value = Number(hpInputValues[participant.battleId]);
    if (!isNaN(value) && value !== 0) {
      if (onUpdateParticipantHP) {
        const currentHp = Number(participant.hp) || 0;
        const maxHp = Number(participant.maxHp) || currentHp;
        const newHp = Math.min(maxHp, currentHp + value);
        onUpdateParticipantHP(participant.battleId, newHp);
      }
      setHpInputValues(prev => ({ ...prev, [participant.battleId]: '' }));
    }
  };

  const handleTempHpAdd = (participant) => {
    const value = Number(tempHpInputValues[participant.battleId]);
    if (!isNaN(value) && value !== 0) {
      if (typeof window.handleUpdateParticipantTempHP === 'function') {
        window.handleUpdateParticipantTempHP(participant.battleId, value);
      }
      setTempHpInputValues(prev => ({ ...prev, [participant.battleId]: '' }));
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
    const condition = CONDITIONS[conditionId.toUpperCase().replace('-', '_')] ||
      Object.values(CONDITIONS).find(c => c.id === conditionId);
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
  useEffect(() => {
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

  useEffect(() => {
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

  useEffect(() => {
    window.updateBattleParticipantInitiative = (battleId, newInitiative) => {
      if (!battleId) return;
      // Update in App state
      if (typeof window.setBattleParticipants === 'function') {
        window.setBattleParticipants(prev => prev.map(p => p.battleId === battleId ? { ...p, initiative: newInitiative } : p));
      }
    };
    return () => { window.updateBattleParticipantInitiative = undefined; };
  }, []);

  // Add effect to handle persistent damage checks after HP updates
  useEffect(() => {
    if (pendingPersistentDamageCheck) {
      const { participantId, instances } = pendingPersistentDamageCheck;
      const participant = participants.find(p => p.battleId === participantId);
      
      if (participant) {
        // If HP is 0, remove all persistent damage
        if (Number(participant.hp) === 0) {
          const { persistentDamage, ...remainingConditions } = participant.conditions;
          onUpdateBattleParticipant({
            ...participant,
            conditions: remainingConditions
          });
        } else if (instances.length > 0) {
          // Show dialog for first instance if HP is not 0
          const firstInstance = instances[0];
          setPersistentDamageDialog({
            show: true,
            participantId,
            damageType: firstInstance.damageType,
            damageValue: firstInstance.damageValue,
            remainingInstances: instances.slice(1)
          });
        }
      }
      setPendingPersistentDamageCheck(null);
    }
  }, [participants, pendingPersistentDamageCheck]);

  // Modify handlePersistentDamage function
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
    if (totalDamage > 0) {
      if (typeof window.handleParticipantDamage === 'function') {
        window.handleParticipantDamage(participant.battleId, totalDamage);
      } else if (onUpdateParticipantHP) {
        // Fallback to old behavior if new function not available
        const newHp = Math.max(0, Number(participant.hp) - totalDamage);
        onUpdateParticipantHP(participant.battleId, newHp);
      }

      // Set pending check to be handled by useEffect after HP update
      setPendingPersistentDamageCheck({
        participantId: participant.battleId,
        instances: persistentDamageInstances
      });
    }
  };

  // Modify handleFinishTurn to scroll to active participant
  const handleFinishTurn = () => {
    if (onFinishTurn) {
      const currentParticipant = participants.find(p => p.battleId === currentTurn);
      if (currentParticipant) {
        handlePersistentDamage(currentParticipant);
        // Collapse the attacks section for the current participant
        setExpandedAttacks(prev => ({
          ...prev,
          [currentTurn]: false
        }));
      }
      onFinishTurn();
      
      // Use setTimeout with a longer delay to ensure the DOM has updated
      setTimeout(() => {
        if (activeParticipantRef.current) {
          activeParticipantRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        } else {
          console.log('Active participant ref not found');
        }
      }, 100);
    }
  };

  // Add effect to handle persistent damage at start of round
  useEffect(() => {
    if (isBattleStarted && currentRound > 0) {
      // Find the participant with the current turn
      const currentParticipant = participants.find(p => p.battleId === currentTurn);
      if (currentParticipant) {
        handlePersistentDamage(currentParticipant);
      }
    }
  }, [currentRound, isBattleStarted, currentTurn]);

  // Move the effect here, inside BattleTab
  useEffect(() => {
    function handleConditionClick(e) {
      const target = e.target;
      if (target.classList && target.classList.contains('condition-link')) {
        e.preventDefault();
        e.stopPropagation(); // Prevent spell collapse/expand when clicking condition link
        const condName = target.getAttribute('data-condition');
        const found = conditionList.find(c => c.name === condName);
        if (found) {
          setConditionModalData(found);
          setShowConditionModal(true);
        }
      }
    }
    document.addEventListener('click', handleConditionClick);
    return () => document.removeEventListener('click', handleConditionClick);
  }, []);

  const handleWeakAdjustment = (creature) => {
    // If creature is already elite, show warning
    if (creature.isElite) {
      alert('This creature is already Elite. Remove Elite status first to apply Weak adjustments.');
      return;
    }
    // If creature is already weak, remove weak status and restore original stats
    if (creature.isWeak) {
      if (creature.originalStats) {
        const restored = { ...creature, ...creature.originalStats, isWeak: false };
        delete restored.originalStats;
        onUpdateBattleParticipant(restored);
      } else {
        onUpdateBattleParticipant({ ...creature, isWeak: false });
      }
      return;
    }

    // If switching from Elite to Weak, restore original stats first
    let baseStats = creature;
    if (creature.isElite && creature.originalStats) {
      baseStats = { ...creature, ...creature.originalStats, isElite: false };
      delete baseStats.originalStats;
    }

    // Store original stats
    const originalStats = {
      level: baseStats.level,
      ac: baseStats.ac,
      perception: baseStats.perception,
      fortitude: baseStats.fortitude,
      reflex: baseStats.reflex,
      will: baseStats.will,
      dc: baseStats.dc,
      spellAttackMod: baseStats.spellAttackMod,
      maxHp: baseStats.maxHp,
      hp: baseStats.hp,
      attacks: JSON.parse(JSON.stringify(baseStats.attacks || []))
    };
    let updatedCreature = { ...baseStats, isWeak: true, isElite: false, originalStats };

    // Decrease level
    if (updatedCreature.level) {
      updatedCreature.level = Number(updatedCreature.level) - (Number(updatedCreature.level) === 1 ? 2 : 1);
    }

    // Decrease AC, attack modifiers, DCs, saving throws and Perception
    const statsToDecrease = ['ac', 'perception', 'fortitude', 'reflex', 'will', 'dc', 'spellAttackMod'];
    statsToDecrease.forEach(stat => {
      if (updatedCreature[stat] !== undefined && updatedCreature[stat] !== null) {
        updatedCreature[stat] = Number(updatedCreature[stat]) - 2;
      }
    });

    if (Array.isArray(updatedCreature.attacks)) {
      updatedCreature.attacks = updatedCreature.attacks.map(attack => {
        const updatedAttack = { ...attack };
        for (const key in updatedAttack) {
          if (
            updatedAttack.hasOwnProperty(key) &&
            typeof updatedAttack[key] === 'number' &&
            key.toLowerCase().includes('mod')
          ) {
            updatedAttack[key] -= 2;
          }
        }
        return updatedAttack;
      });
    }

    // Decrease HP based on level
    if (updatedCreature.maxHp) {
      const level = Number(updatedCreature.level) || 1;
      let hpDecrease = 20; // default for levels 6-20
      if (level <= 2) hpDecrease = 10;
      else if (level <= 5) hpDecrease = 15;
      else if (level >= 21) hpDecrease = 30;
      updatedCreature.maxHp = Number(updatedCreature.maxHp) - hpDecrease;
      updatedCreature.hp = Math.min(Number(updatedCreature.hp), updatedCreature.maxHp);
    }

    // Decrease damage of attacks
    if (updatedCreature.attacks) {
      updatedCreature.attacks = updatedCreature.attacks.map(attack => {
        const updatedAttack = { ...attack };
        if (attack.damage) {
          const isLimitedUse = attack.attackType === 'spell' || attack.attackType === 'regularSpell';
          const damageDecrease = isLimitedUse ? 4 : 2;
          try {
            const damageMatch = attack.damage.match(/(\d+)d(\d+)([+-]\d+)?(?:\s+(\w+))?/);
            if (damageMatch) {
              const [_, dice, sides, modifier, damageType] = damageMatch;
              const modValue = modifier ? parseInt(modifier) : 0;
              const newModValue = Math.max(0, modValue - damageDecrease);
              updatedAttack.damage = `${dice}d${sides}${newModValue > 0 ? '+' + newModValue : ''}${damageType ? ' ' + damageType : ''}`;
            }
          } catch (e) {
            console.error('Error parsing damage value:', e);
          }
        }
        return updatedAttack;
      });
    }

    onUpdateBattleParticipant(updatedCreature);
  };

  const handleEliteAdjustment = (creature) => {
    // If creature is already weak, show warning
    if (creature.isWeak) {
      alert('This creature is already Weak. Remove Weak status first to apply Elite adjustments.');
      return;
    }
    // If creature is already elite, remove elite status and restore original stats
    if (creature.isElite) {
      if (creature.originalStats) {
        const restored = { ...creature, ...creature.originalStats, isElite: false };
        delete restored.originalStats;
        onUpdateBattleParticipant(restored);
      } else {
        onUpdateBattleParticipant({ ...creature, isElite: false });
      }
      return;
    }

    // If switching from Weak to Elite, restore original stats first
    let baseStats = creature;
    if (creature.isWeak && creature.originalStats) {
      baseStats = { ...creature, ...creature.originalStats, isWeak: false };
      delete baseStats.originalStats;
    }

    // Store original stats
    const originalStats = {
      level: baseStats.level,
      ac: baseStats.ac,
      perception: baseStats.perception,
      fortitude: baseStats.fortitude,
      reflex: baseStats.reflex,
      will: baseStats.will,
      dc: baseStats.dc,
      spellAttackMod: baseStats.spellAttackMod,
      maxHp: baseStats.maxHp,
      hp: baseStats.hp,
      attacks: JSON.parse(JSON.stringify(baseStats.attacks || []))
    };
    let updatedCreature = { ...baseStats, isElite: true, isWeak: false, originalStats };

    // Increase level
    if (updatedCreature.level) {
      updatedCreature.level = Number(updatedCreature.level) + 1;
    }

    // Increase AC, attack modifiers, DCs, saving throws and Perception
    const statsToIncrease = ['ac', 'perception', 'fortitude', 'reflex', 'will', 'dc', 'spellAttackMod'];
    statsToIncrease.forEach(stat => {
      if (updatedCreature[stat] !== undefined && updatedCreature[stat] !== null) {
        updatedCreature[stat] = Number(updatedCreature[stat]) + 2;
      }
    });

    if (Array.isArray(updatedCreature.attacks)) {
      updatedCreature.attacks = updatedCreature.attacks.map(attack => {
        const updatedAttack = { ...attack };
        for (const key in updatedAttack) {
          if (
            updatedAttack.hasOwnProperty(key) &&
            typeof updatedAttack[key] === 'number' &&
            key.toLowerCase().includes('mod')
          ) {
            updatedAttack[key] += 2;
          }
        }
        return updatedAttack;
      });
    }

    // Increase HP based on level
    if (updatedCreature.maxHp) {
      const level = Number(updatedCreature.level) || 1;
      let hpIncrease = 20; // default for levels 6-20
      if (level <= 2) hpIncrease = 10;
      else if (level <= 5) hpIncrease = 15;
      else if (level >= 21) hpIncrease = 30;
      updatedCreature.maxHp = Number(updatedCreature.maxHp) + hpIncrease;
      updatedCreature.hp = Math.min(Number(updatedCreature.hp) + hpIncrease, updatedCreature.maxHp);
    }

    // Increase damage of attacks
    if (updatedCreature.attacks) {
      updatedCreature.attacks = updatedCreature.attacks.map(attack => {
        const updatedAttack = { ...attack };
        if (attack.damage) {
          const isLimitedUse = attack.attackType === 'spell' || attack.attackType === 'regularSpell';
          const damageIncrease = isLimitedUse ? 4 : 2;
          try {
            const damageMatch = attack.damage.match(/(\d+)d(\d+)([+-]\d+)?(?:\s+(\w+))?/);
            if (damageMatch) {
              const [_, dice, sides, modifier, damageType] = damageMatch;
              const modValue = modifier ? parseInt(modifier) : 0;
              const newModValue = modValue + damageIncrease;
              updatedAttack.damage = `${dice}d${sides}+${newModValue}${damageType ? ' ' + damageType : ''}`;
            }
          } catch (e) {
            console.error('Error parsing damage value:', e);
          }
        }
        return updatedAttack;
      });
    }

    onUpdateBattleParticipant(updatedCreature);
  };

  const handleEliteToggle = (creature) => {
    if (creature.isElite) {
      const updatedCreature = { ...creature, isElite: false };
      if (creature.originalStats) {
        Object.entries(creature.originalStats).forEach(([key, value]) => {
          updatedCreature[key] = value;
        });
        delete updatedCreature.originalStats;
      }
      onUpdateCreature(updatedCreature);
      setEliteDialogOpen(false);
      setCreatureToElite(null);
      return;
    }
    // ... existing code ...
  };

  const handleWeakToggle = (creature) => {
    if (creature.isWeak) {
      const updatedCreature = { ...creature, isWeak: false };
      if (creature.originalStats) {
        Object.entries(creature.originalStats).forEach(([key, value]) => {
          updatedCreature[key] = value;
        });
        delete updatedCreature.originalStats;
      }
      onUpdateCreature(updatedCreature);
      setWeakDialogOpen(false);
      setCreatureToWeak(null);
      return;
    }
    // ... existing code ...
  };

  // Add this effect to automatically expand attacks for the current turn
  useEffect(() => {
    if (currentTurn) {
      setExpandedAttacks(prev => ({
        ...prev,
        [currentTurn]: true
      }));
    }
  }, [currentTurn]);

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Container fluid>
          <Row>
            <Col md={showConditionsMenu ? 9 : 12}>
              <div style={{ position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'white' }}>
                <Card>
                  <Card.Header className="d-flex flex-column">
                    <div className="d-flex align-items-center gap-3">
                      <h5 className="mb-0">Battle</h5>
                      <span className="badge bg-secondary">Round: {currentRound}</span>
                    </div>
                    <div className="menu-btn-group mt-2" style={{ justifyContent: 'flex-end' }}>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setShowConditionsMenu(!showConditionsMenu)}
                      >
                        {showConditionsMenu ? 'Hide' : 'Show'} Conditions
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
                    </div>
                  </Card.Header>
                </Card>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <ListGroup>
                  {participants.map((participant) => (
                    <Droppable
                      key={participant.battleId}
                      droppableId={String(participant.battleId)}
                      isDropDisabled={!isBattleStarted}
                    >
                      {(provided, snapshot) => (
                        <ListGroupItem
                          ref={(el) => {
                            provided.innerRef(el);
                            if (currentTurn === participant.battleId) {
                              activeParticipantRef.current = el;
                            }
                          }}
                          {...provided.droppableProps}
                          style={{
                            scrollMarginTop: '150px',
                            ...provided.draggableProps?.style
                          }}
                          className={`d-flex justify-content-between align-items-center ${
                            currentTurn === participant.battleId ? 'highlighted-turn' : ''
                          } ${
                            Number(participant.hp) <= 0 ? 'hp-below-zero' : ''
                          } ${
                            currentTurn === participant.battleId && Number(participant.hp) <= 0 ? 'hp-below-zero-highlighted' : ''
                          } ${
                            snapshot.isDraggingOver ? 'droppable-active' : ''
                          }`}
                        >
                          {/* Add back the separate ref div but position it at the top of the card */}
                          {currentTurn === participant.battleId && (
                            <div 
                              ref={activeParticipantRef}
                              style={{ position: 'absolute', top: '-150px' }}
                            />
                          )}
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
                                <CreatureCard
                                  participant={participant}
                                  currentTurn={currentTurn}
                                  expandedAttacks={expandedAttacks}
                                  setExpandedAttacks={setExpandedAttacks}
                                  expandedSpells={expandedSpells}
                                  setExpandedSpells={setExpandedSpells}
                                  onDeleteClick={handleDeleteClick}
                                  onWeakAdjustment={handleWeakAdjustment}
                                  onEliteAdjustment={handleEliteAdjustment}
                                  onEditCreatureClick={handleEditCreatureClick}
                                  hpInputValues={hpInputValues}
                                  tempHpInputValues={tempHpInputValues}
                                  onHpInputChange={handleHpInputChange}
                                  onTempHpInputChange={handleTempHpInputChange}
                                  onHpAdd={handleHpAdd}
                                  onHpSubtract={handleHpSubtract}
                                  onTempHpAdd={handleTempHpAdd}
                                />
                              ) : (
                                <PlayerCard
                                  participant={participant}
                                  currentTurn={currentTurn}
                                  hpInputValues={hpInputValues}
                                  tempHpInputValues={tempHpInputValues}
                                  onHpInputChange={handleHpInputChange}
                                  onTempHpInputChange={handleTempHpInputChange}
                                  onHpAdd={handleHpAdd}
                                  onHpSubtract={handleHpSubtract}
                                  onTempHpAdd={handleTempHpAdd}
                                  onDeleteClick={handleDeleteClick}
                                  onEditPlayerClick={handleEditPlayerClick}
                                />
                              )}
                            </div>
                            {participant.conditions && Object.entries(participant.conditions).length > 0 && (
                              <div className="mt-2">
                                <strong>Conditions:</strong>
                                <div className="d-flex flex-wrap gap-1 mt-1">
                                  {Object.entries(participant.conditions || {}).map(([conditionId, data]) => {
                                    const condition = CONDITIONS[conditionId.toUpperCase().replace('-', '_')] ||
                                      Object.values(CONDITIONS).find(c => c.id === conditionId);
                                    if (!condition) return null;

                                    if (conditionId === 'persistentDamage' && data.instances) {
                                      return data.instances.map((instance, index) => {
                                        const badgeKey = `${participant.battleId}-persistentDamage-${instance.damageType}-${index}`;
                                        return (
                                          <Badge
                                            key={badgeKey}
                                            bg="danger"
                                            className="d-flex align-items-center"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handlePersistentDamageClick(participant.battleId, instance.damageType, instance.damageValue)}
                                          >
                                            {instance.damageType} {instance.damageValue}
                                            <Button
                                              variant="light"
                                              size="sm"
                                              className="ms-1 py-0 px-1"
                                              style={{ lineHeight: 1, fontSize: '0.9em' }}
                                              onClick={e => {
                                                e.stopPropagation();
                                                handleRemoveCondition(participant.battleId, conditionId, instance);
                                              }}
                                            >
                                              <X size={12} />
                                            </Button>
                                          </Badge>
                                        );
                                      });
                                    }

                                    const badgeKey = `${participant.battleId}-condition-${conditionId}`;
                                    return (
                                      <Badge
                                        key={badgeKey}
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
                          {provided.placeholder}
                        </ListGroupItem>
                      )}
                    </Droppable>
                  ))}
                </ListGroup>
              </div>
            </Col>
            {showConditionsMenu && (
              <Col md={3}>
                <div style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
                  <ConditionsMenu isBattleStarted={isBattleStarted} />
                </div>
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
                        <div className="col-md-3 mb-3">
                          <label className="form-label">HP</label>
                          <input type="number" className="form-control" value={creatureToEdit.maxHp} onChange={e => handleEditCreatureChange('maxHp', e.target.value)} />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">AC</label>
                          <input type="number" className="form-control" value={creatureToEdit.ac} onChange={e => handleEditCreatureChange('ac', e.target.value)} />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">DC</label>
                          <input type="number" className="form-control" value={creatureToEdit.dc} onChange={e => handleEditCreatureChange('dc', e.target.value)} />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">Spell Attack Mod</label>
                          <input type="number" className="form-control" value={creatureToEdit.spellAttackMod} onChange={e => handleEditCreatureChange('spellAttackMod', e.target.value)} />
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
                      <div className="row">
                        <div className="col-md-12 mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="mb-0">Resistances</h6>
                              <Button variant="outline-primary" size="sm" onClick={() => setCreatureToEdit(prev => ({ ...prev, resistances: [...(prev.resistances || []), { type: '', value: '' }] }))}>
                                <Plus /> Add Resistance
                              </Button>
                            </div>
                            {creatureToEdit.resistances && creatureToEdit.resistances.map((resistance, index) => (
                              <div key={index} className="row mb-2">
                                <div className="col-md-5">
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={resistance.type}
                                    onChange={e => {
                                      const updatedResistances = [...creatureToEdit.resistances];
                                      updatedResistances[index] = { ...updatedResistances[index], type: e.target.value };
                                      setCreatureToEdit(prev => ({ ...prev, resistances: updatedResistances }));
                                    }}
                                    placeholder="Resistance type (e.g., Fire)"
                                  />
                                </div>
                                <div className="col-md-5">
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={resistance.value}
                                    onChange={e => {
                                      const updatedResistances = [...creatureToEdit.resistances];
                                      updatedResistances[index] = { ...updatedResistances[index], value: e.target.value };
                                      setCreatureToEdit(prev => ({ ...prev, resistances: updatedResistances }));
                                    }}
                                    placeholder="Value (e.g., 5)"
                                  />
                                </div>
                                <div className="col-md-2">
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => setCreatureToEdit(prev => ({ ...prev, resistances: prev.resistances.filter((_, i) => i !== index) }))}
                                  >
                                    <Trash />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-12 mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="mb-0">Immunities</h6>
                              <Button variant="outline-primary" size="sm" onClick={() => setCreatureToEdit(prev => ({ ...prev, immunities: [...(prev.immunities || []), ''] }))}>
                                <Plus /> Add Immunity
                              </Button>
                            </div>
                            {creatureToEdit.immunities && creatureToEdit.immunities.map((immunity, index) => (
                              <div key={index} className="row mb-2">
                                <div className="col-md-10">
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={immunity}
                                    onChange={e => {
                                      const updatedImmunities = [...creatureToEdit.immunities];
                                      updatedImmunities[index] = e.target.value;
                                      setCreatureToEdit(prev => ({ ...prev, immunities: updatedImmunities }));
                                    }}
                                    placeholder="Immunity type (e.g., Fire, Poison)"
                                  />
                                </div>
                                <div className="col-md-2">
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => setCreatureToEdit(prev => ({ ...prev, immunities: prev.immunities.filter((_, i) => i !== index) }))}
                                  >
                                    <Trash />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-12 mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="mb-0">Weaknesses</h6>
                              <Button variant="outline-primary" size="sm" onClick={() => setCreatureToEdit(prev => ({ ...prev, weaknesses: [...(prev.weaknesses || []), { type: '', value: '' }] }))}>
                                <Plus /> Add Weakness
                              </Button>
                            </div>
                            {creatureToEdit.weaknesses && creatureToEdit.weaknesses.map((weakness, index) => (
                              <div key={index} className="row mb-2">
                                <div className="col-md-5">
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={weakness.type}
                                    onChange={e => {
                                      const updatedWeaknesses = [...creatureToEdit.weaknesses];
                                      updatedWeaknesses[index] = { ...updatedWeaknesses[index], type: e.target.value };
                                      setCreatureToEdit(prev => ({ ...prev, weaknesses: updatedWeaknesses }));
                                    }}
                                    placeholder="Weakness type (e.g., Fire)"
                                  />
                                </div>
                                <div className="col-md-5">
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={weakness.value}
                                    onChange={e => {
                                      const updatedWeaknesses = [...creatureToEdit.weaknesses];
                                      updatedWeaknesses[index] = { ...updatedWeaknesses[index], value: e.target.value };
                                      setCreatureToEdit(prev => ({ ...prev, weaknesses: updatedWeaknesses }));
                                    }}
                                    placeholder="Value (e.g., 5)"
                                  />
                                </div>
                                <div className="col-md-2">
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => setCreatureToEdit(prev => ({ ...prev, weaknesses: prev.weaknesses.filter((_, i) => i !== index) }))}
                                  >
                                    <Trash />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

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

                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0">Actions</h6>
                          </div>
                          <CreatureActionForm
                            actions={creatureToEdit.actions || []}
                            onChange={actions => setCreatureToEdit(prev => ({ ...prev, actions }))}
                            onAddAction={type => setCreatureToEdit(prev => ({
                              ...prev,
                              actions: [
                                ...(prev.actions || []),
                                {
                                  name: '',
                                  actionType: type,
                                  actions: type === 'action' ? '1' : null,
                                  description: '',
                                  traits: []
                                }
                              ]
                            }))}
                            onRemoveAction={index => setCreatureToEdit(prev => ({
                              ...prev,
                              actions: prev.actions.filter((_, i) => i !== index)
                            }))}
                          />
                        </div>

                        <div className="mb-3">
                          <CreatureSkillsForm
                            skills={creatureToEdit.skills || {}}
                            onChange={skills => handleEditCreatureChange('skills', skills)}
                          />
                        </div>

                        <div className="d-flex justify-content-end gap-2">
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
        {showConditionModal && conditionModalData && (
          <div className="modal show fade d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{conditionModalData.name}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowConditionModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div dangerouslySetInnerHTML={{ __html: linkifyConditions(conditionModalData.description) }} />
                </div>
                <div className="modal-footer">
                  <Button variant="secondary" onClick={() => setShowConditionModal(false)}>Close</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Player Edit Dialog */}
        {editPlayerDialogOpen && playerToEdit && (
          <div className="modal show fade d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Player</h5>
                  <button type="button" className="btn-close" onClick={() => setEditPlayerDialogOpen(false)}></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={e => { e.preventDefault(); handleEditPlayerSave(); }}>
                    <div className="mb-3">
                      <label className="form-label">Player Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={playerToEdit.name}
                        onChange={e => handleEditPlayerChange('name', e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">HP</label>
                      <input
                        type="number"
                        className="form-control"
                        value={playerToEdit.maxHp}
                        onChange={e => handleEditPlayerChange('maxHp', e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">AC</label>
                      <input
                        type="number"
                        className="form-control"
                        value={playerToEdit.ac}
                        onChange={e => handleEditPlayerChange('ac', e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Level</label>
                      <input
                        type="number"
                        className="form-control"
                        value={playerToEdit.level}
                        onChange={e => handleEditPlayerChange('level', e.target.value)}
                      />
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                      <Button variant="secondary" onClick={() => setEditPlayerDialogOpen(false)} type="button">Cancel</Button>
                      <Button variant="primary" type="submit">Save</Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  export default BattleTab; 
import React, { useState } from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import { Droppable, Draggable } from '@hello-pangea/dnd';

const CONDITIONS = {
  OFF_GUARD: {
    id: 'off-guard',
    name: 'Off Guard',
    description: 'Reduces AC by 2',
    maxStacks: 1,
    effects: {
      ac: -2
    }
  },
  FRIGHTENED: {
    id: 'frightened',
    name: 'Frightened',
    description: 'Reduces AC, DC, Perception, Fortitude, Reflex, Will, and attack modifiers by 1',
    maxStacks: 4,
    effects: {
      ac: -1,
      dc: -1,
      perception: -1,
      fortitude: -1,
      reflex: -1,
      will: -1,
      firstHitModifier: -1,
      secondHitModifier: -1,
      thirdHitModifier: -1
    }
  },
  ENFEEBLED: {
    id: 'enfeeble',
    name: 'Enfeebled',
    description: 'Reduces melee attack modifiers and damage',
    maxStacks: 3,
    effects: {
      meleeFirstHitModifier: -1,
      meleeSecondHitModifier: -1,
      meleeThirdHitModifier: -1,
      meleeDamage: -1
    }
  },
  FATIGUED: {
    id: 'fatigued',
    name: 'Fatigued',
    description: 'You are tired and can not summon much energy. You take a -1 status penalty to AC and saving throws. While exploring, you can not choose an exploration activity. You recover from fatigue after a full nights rest.',
    maxStacks: 1,
    effects: {
      fortitude: -1,
      reflex: -1,
      will: -1,
      ac: -1
    }
  },
  SICKENED: {
    id: 'sickened',
    name: 'Sickened',
    description: 'You feel ill. Sickened always includes a value. You take a status penalty equal to this value on all your checks and DCs. You can nott willingly ingest anything-including elixirs and potions-while sickened.',
    maxStacks: 5,
    effects: {
      ac: -1,
      dc: -1,
      perception: -1,
      fortitude: -1,
      reflex: -1,
      will: -1,
      firstHitModifier: -1,
      secondHitModifier: -1,
      thirdHitModifier: -1
    }
  },
  CLUMSY: {
    id: 'clumsy',
    name: 'Clumsy',
    description: 'You take a status penalty equal to the condition value to Dexterity-based checks and DCs, including AC, Reflex saves, ranged attack rolls, and skill checks using Acrobatics, Stealth, and Thievery.',
    maxStacks: 5,
    effects: {
      ac: -1,
      reflex: -1,
      rangedFirstHitModifier: -1,
      rangedSecondHitModifier: -1,
      rangedThirdHitModifier: -1
    }
  },
  STUPEFIED: {
    id: 'stupefied',
    name: 'Stupefied',
    description: 'You take a status penalty equal to this value on Intelligence-, Wisdom-, and Charisma-based checks and DCs, including Will saving throws, spell attack rolls, spell DCs, and skill checks that use these ability scores. Any time you attempt to Cast a Spell while stupefied, the spell is disrupted unless you succeed at a flat check with a DC equal to 5 + your stupefied value.',
    maxStacks: 5,
    effects: {
      dc: -1,
      will: -1,
      spellFirstHitModifier: -1,
      spellSecondHitModifier: -1,
      spellThirdHitModifier: -1
    }
  },
  DRAINED: {
    id: 'drained',
    name: 'Drained',
    description: '',
    maxStacks: 5,
    effects: {
      fortitude: -1,
    }
  },
  PERSISTENTDAMAGE: {
    id: 'persistentDamage',
    name: 'Persistent Damage',
    description: 'You take persistent damage at the start of your turn. Each instance can have a different damage type and value.',
    maxStacks: 1,
    allowMultipleInstances: true,
    effects: {
      // No direct effects, damage is handled separately
    }
  }
};

function ConditionsMenu({ isBattleStarted = false }) {
  const [openCondition, setOpenCondition] = useState(null);
  return (
    <Card className="h-100">
      <Card.Header>Conditions</Card.Header>
      <Droppable droppableId="conditions-menu" isDropDisabled={true}>
        {(provided) => (
          <ListGroup
            variant="flush"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {Object.values(CONDITIONS).map((condition, index) => (
              <Draggable
                key={condition.id}
                draggableId={condition.id}
                index={index}
                isDragDisabled={!isBattleStarted}
              >
                {(provided, snapshot) => (
                  <ListGroup.Item
                    key={condition.id}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`condition-card ${snapshot.isDragging ? 'dragging' : ''}`}
                    style={{
                      ...provided.draggableProps.style,
                      cursor: isBattleStarted ? 'grab' : 'not-allowed',
                      opacity: isBattleStarted ? 1 : 0.5
                    }}
                    onClick={() => setOpenCondition(openCondition === condition.id ? null : condition.id)}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{condition.name}</strong>
                        {openCondition === condition.id && (
                          <>
                            <div className="small text-muted">{condition.description}</div>
                            <div className="small text-muted">Max Stacks: {condition.maxStacks}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </ListGroup.Item>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ListGroup>
        )}
      </Droppable>
    </Card>
  );
}

export default ConditionsMenu;
export { CONDITIONS }; 
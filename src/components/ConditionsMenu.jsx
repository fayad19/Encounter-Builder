import React from 'react';
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
      firstHitModifier: -1,
      secondHitModifier: -1,
      thirdHitModifier: -1,
      meleeDamage: -1
    }
  }
};

function ConditionsMenu({ isBattleStarted = false }) {
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
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`condition-card ${snapshot.isDragging ? 'dragging' : ''}`}
                    style={{
                      ...provided.draggableProps.style,
                      cursor: isBattleStarted ? 'grab' : 'not-allowed',
                      opacity: isBattleStarted ? 1 : 0.5
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{condition.name}</strong>
                        <div className="small text-muted">{condition.description}</div>
                        <div className="small text-muted">Max Stacks: {condition.maxStacks}</div>
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
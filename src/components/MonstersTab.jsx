import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup, ListGroupItem } from 'react-bootstrap';
import { Plus, Pencil, Trash, X, PlusCircle } from 'react-bootstrap-icons';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import CreatureAttackForm from './CreatureAttackForm';
import CreatureActionForm from './CreatureActionForm';

function CreaturesTab({ 
  savedCreatures = [], 
  onAddCreature, 
  onUpdateCreature, 
  onDeleteCreature,
  onAddToBattle 
}) {
  const [newCreature, setNewCreature] = useState({
    name: '',
    hp: '',
    ac: '',
    //initiative: '',
    penalty: '',
    attacks: [],
    actions: [] // Add actions array
  });
  const [editingCreature, setEditingCreature] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [creatureToDelete, setCreatureToDelete] = useState(null);
  const [spellAttackAreaType, setSpellAttackAreaType] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCreature(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAttackChange = (index, field, value) => {
    const updatedAttacks = [...newCreature.attacks];
    updatedAttacks[index] = {
      ...updatedAttacks[index],
      [field]: value
    };
    setNewCreature(prev => ({
      ...prev,
      attacks: updatedAttacks
    }));
  };

  const handleAddAttack = (type) => {
    if (type === 'spell') {
      setNewCreature(prev => ({
        ...prev,
        attacks: [
          ...prev.attacks,
          {
            attackName: '',
            attackType: 'spell',
            tradition: [],
            actions: '1',
            targetOrArea: 'target',
            areaType: '',
            range: ''
          }
        ]
      }));
    } else {
      setNewCreature(prev => ({
        ...prev,
        attacks: [
          ...prev.attacks,
          {
            attackName: '',
            attackType: type,
            firstHitModifier: '',
            secondHitModifier: '',
            thirdHitModifier: '',
            damage: ''
          }
        ]
      }));
    }
  };

  const handleRemoveAttack = (index) => {
    setNewCreature(prev => ({
      ...prev,
      attacks: prev.attacks.filter((_, i) => i !== index)
    }));
  };

  const handleAddAction = (type) => {
    setNewCreature(prev => ({
      ...prev,
      actions: [
        ...prev.actions,
        {
          name: '',
          actionType: type,
          actions: type === 'action' ? '1' : null,
          description: ''
        }
      ]
    }));
  };

  const handleRemoveAction = (index) => {
    setNewCreature(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const handleActionChange = (actions) => {
    setNewCreature(prev => ({
      ...prev,
      actions
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newCreature.name) {
      if (editingCreature) {
        onUpdateCreature({
          ...editingCreature,
          ...newCreature
        });
        setEditingCreature(null);
      } else {
        onAddCreature({ ...newCreature, id: Date.now() });
      }
      setNewCreature({
        name: '',
        hp: '',
        ac: '',
        //initiative: '',
        penalty: '',
        attacks: [],
        actions: []
      });
    }
  };

  const handleEditClick = (creature) => {
    setNewCreature({
      name: creature.name,
      hp: creature.hp,
      ac: creature.ac,
      //initiative: creature.initiative,
      penalty: creature.penalty,
      attacks: creature.attacks || [],
      actions: creature.actions || []
    });
    setEditingCreature(creature);
  };

  const handleCancelEdit = () => {
    setEditingCreature(null);
    setNewCreature({
      name: '',
      hp: '',
      ac: '',
      //initiative: '',
      penalty: '',
      attacks: [],
      actions: []
    });
  };

  const handleDeleteClick = (creature) => {
    setCreatureToDelete(creature);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (creatureToDelete) {
      onDeleteCreature(creatureToDelete.id);
      setDeleteDialogOpen(false);
      setCreatureToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCreatureToDelete(null);
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col md={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">{editingCreature ? 'Edit Creature' : 'Add New Creature'}</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Creature Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={newCreature.name}
                    onChange={handleInputChange}
                    placeholder="Enter creature name"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>HP</Form.Label>
                      <Form.Control
                        type="number"
                        name="hp"
                        value={newCreature.hp}
                        onChange={handleInputChange}
                        placeholder="Enter HP"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>AC</Form.Label>
                      <Form.Control
                        type="number"
                        name="ac"
                        value={newCreature.ac}
                        onChange={handleInputChange}
                        placeholder="Enter AC"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  {/* <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Initiative</Form.Label>
                      <Form.Control
                        type="number"
                        name="initiative"
                        value={newCreature.initiative}
                        onChange={handleInputChange}
                        placeholder="Enter initiative"
                      />
                    </Form.Group>
                  </Col> */}
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Penalty</Form.Label>
                      <Form.Control
                        type="number"
                        name="penalty"
                        value={newCreature.penalty}
                        onChange={handleInputChange}
                        placeholder="Enter penalty - WIP, not implemented yet"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Attacks Section */}
                <CreatureAttackForm
                  attacks={newCreature.attacks}
                  onChange={attacks => setNewCreature(prev => ({ ...prev, attacks }))}
                  onAddAttack={handleAddAttack}
                  onRemoveAttack={handleRemoveAttack}
                />

                {/* Actions Section */}
                <CreatureActionForm
                  actions={newCreature.actions}
                  onChange={handleActionChange}
                  onAddAction={handleAddAction}
                  onRemoveAction={handleRemoveAction}
                />
                
                <div className="d-flex gap-2">
                  <Button variant="primary" type="submit" disabled={!newCreature.name}>
                    {editingCreature ? 'Save Changes' : 'Add Creature'}
                  </Button>
                  {editingCreature && (
                    <Button variant="secondary" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Saved Creatures</h5>
            </Card.Header>
            <ListGroup variant="flush">
              {savedCreatures.map((creature) => (
                <ListGroupItem key={creature.id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{creature.name}</strong>
                    <div className="small text-muted">
                      HP: {creature.hp} | AC: {creature.ac}
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => onAddToBattle(creature)}
                    >
                      <Plus />
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleEditClick(creature)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteClick(creature)}
                    >
                      <Trash />
                    </Button>
                  </div>
                </ListGroupItem>
              ))}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Creature"
        message={`Are you sure you want to delete ${creatureToDelete?.name || 'this creature'}?`}
      />
    </Container>
  );
}

export default CreaturesTab; 
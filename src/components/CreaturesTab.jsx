import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup, ListGroupItem } from 'react-bootstrap';
import { Plus, Pencil, Trash, X, PlusCircle } from 'react-bootstrap-icons';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import CreatureAttackForm from './CreatureAttackForm';

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
    perception: '',
    fortitude: '',
    reflex: '',
    will: '',
    penalty: '',
    attacks: [], // Start with no attacks
    resistances: [], // Add resistances array
    immunities: [], // Add immunities array
    weaknesses: [] // Add weaknesses array
  });
  const [editingCreature, setEditingCreature] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [creatureToDelete, setCreatureToDelete] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCreature(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddAttack = (type) => {
    // const handleAttackChange = (index, field, value) => {
  //   const updatedAttacks = [...newCreature.attacks];
  //   updatedAttacks[index] = {
  //     ...updatedAttacks[index],
  //     [field]: value
  //   };
  //   setNewCreature(prev => ({
  //     ...prev,
  //     attacks: updatedAttacks
  //   }));
  // };

  if (type === 'spell') {
      setNewCreature(prev => ({
        ...prev,
        attacks: [
          ...prev.attacks,
          {
            attackName: '',
            attackType: 'spell',
            attackCategory: 'spell',
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
            attackCategory: type,
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

  const handleAddResistance = () => {
    setNewCreature(prev => ({
      ...prev,
      resistances: [...prev.resistances, { type: '', value: '' }]
    }));
  };

  const handleAddImmunity = () => {
    setNewCreature(prev => ({
      ...prev,
      immunities: [...prev.immunities, { type: '', exceptions: [] }]
    }));
  };

  const handleAddWeakness = () => {
    setNewCreature(prev => ({
      ...prev,
      weaknesses: [...prev.weaknesses, { type: '', value: '' }]
    }));
  };

  const handleRemoveResistance = (index) => {
    setNewCreature(prev => ({
      ...prev,
      resistances: prev.resistances.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveImmunity = (index) => {
    setNewCreature(prev => ({
      ...prev,
      immunities: prev.immunities.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveWeakness = (index) => {
    setNewCreature(prev => ({
      ...prev,
      weaknesses: prev.weaknesses.filter((_, i) => i !== index)
    }));
  };

  const handleResistanceChange = (index, field, value) => {
    const updatedResistances = [...newCreature.resistances];
    updatedResistances[index] = {
      ...updatedResistances[index],
      [field]: value
    };
    setNewCreature(prev => ({
      ...prev,
      resistances: updatedResistances
    }));
  };

  const handleImmunityChange = (index, value) => {
    const updatedImmunities = [...newCreature.immunities];
    updatedImmunities[index] = {
      ...updatedImmunities[index],
      type: value
    };
    setNewCreature(prev => ({
      ...prev,
      immunities: updatedImmunities
    }));
  };

  const handleWeaknessChange = (index, field, value) => {
    const updatedWeaknesses = [...newCreature.weaknesses];
    updatedWeaknesses[index] = {
      ...updatedWeaknesses[index],
      [field]: value
    };
    setNewCreature(prev => ({
      ...prev,
      weaknesses: updatedWeaknesses
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
        resistances: [],
        immunities: [],
        weaknesses: []
      });
    }
  };

  const handleEditClick = (creature) => {
    setNewCreature({
      name: creature.name || '',
      hp: creature.hp || '',
      ac: creature.ac || '',
      perception: creature.perception || '',
      fortitude: creature.fortitude || '',
      reflex: creature.reflex || '',
      will: creature.will || '',
      level: creature.level || '',
      dc: creature.dc || '',
      penalty: creature.penalty || '',
      attacks: creature.attacks || [],
      resistances: creature.resistances || [],
      immunities: creature.immunities || [],
      weaknesses: creature.weaknesses || []
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
      resistances: [],
      immunities: [],
      weaknesses: []
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
                {/* Creature Name and Perception in one row */}
                <Row>
                  <Col md={8}>
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
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>Perception</Form.Label>
                      <Form.Control
                        type="number"
                        name="perception"
                        value={newCreature.perception}
                        onChange={handleInputChange}
                        placeholder="Perception"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>Level</Form.Label>
                      <Form.Control
                        type="number"
                        name="level"
                        value={newCreature.level}
                        onChange={handleInputChange}
                        placeholder="Level"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={4}>
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
                  <Col md={4}>
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
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>DC</Form.Label>
                      <Form.Control
                        type="number"
                        name="dc"
                        value={newCreature.dc}
                        onChange={handleInputChange}
                        placeholder="Enter DC"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fortitude</Form.Label>
                      <Form.Control
                        type="number"
                        name="fortitude"
                        value={newCreature.fortitude}
                        onChange={handleInputChange}
                        placeholder="Enter Fortitude"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Reflex</Form.Label>
                      <Form.Control
                        type="number"
                        name="reflex"
                        value={newCreature.reflex}
                        onChange={handleInputChange}
                        placeholder="Enter Reflex"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Will</Form.Label>
                      <Form.Control
                        type="number"
                        name="will"
                        value={newCreature.will}
                        onChange={handleInputChange}
                        placeholder="Enter Will"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                {/*
                <Row>
                  { <Col md={6}>
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
                  </Col> }
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
                */}
                {/* Add after the Will save field and before the Attacks section */}
                <Row className="mb-3">
                  <Col md={12}>
                    <Card>
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Resistances</h6>
                        <Button variant="outline-primary" size="sm" onClick={handleAddResistance}>
                          <Plus /> Add Resistance
                        </Button>
                      </Card.Header>
                      <Card.Body>
                        {newCreature.resistances.map((resistance, index) => (
                          <Row key={index} className="mb-2">
                            <Col md={5}>
                              <Form.Control
                                type="text"
                                value={resistance.type}
                                onChange={(e) => handleResistanceChange(index, 'type', e.target.value)}
                                placeholder="Resistance type (e.g., Fire)"
                              />
                            </Col>
                            <Col md={5}>
                              <Form.Control
                                type="text"
                                value={resistance.value}
                                onChange={(e) => handleResistanceChange(index, 'value', e.target.value)}
                                placeholder="Value (e.g., 5)"
                              />
                            </Col>
                            <Col md={2}>
                              <Button variant="outline-danger" size="sm" onClick={() => handleRemoveResistance(index)}>
                                <Trash />
                              </Button>
                            </Col>
                          </Row>
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={12}>
                    <Card>
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Immunities</h6>
                        <Button variant="outline-primary" size="sm" onClick={handleAddImmunity}>
                          <Plus /> Add Immunity
                        </Button>
                      </Card.Header>
                      <Card.Body>
                        {newCreature.immunities.map((immunity, index) => (
                          <Row key={index} className="mb-2">
                            <Col md={10}>
                              <Form.Control
                                type="text"
                                value={typeof immunity === 'string' ? immunity : immunity.type}
                                onChange={(e) => handleImmunityChange(index, e.target.value)}
                                placeholder="Immunity type (e.g., Fire, Poison)"
                              />
                            </Col>
                            <Col md={2}>
                              <Button variant="outline-danger" size="sm" onClick={() => handleRemoveImmunity(index)}>
                                <Trash />
                              </Button>
                            </Col>
                          </Row>
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={12}>
                    <Card>
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Weaknesses</h6>
                        <Button variant="outline-primary" size="sm" onClick={handleAddWeakness}>
                          <Plus /> Add Weakness
                        </Button>
                      </Card.Header>
                      <Card.Body>
                        {newCreature.weaknesses.map((weakness, index) => (
                          <Row key={index} className="mb-2">
                            <Col md={5}>
                              <Form.Control
                                type="text"
                                value={weakness.type}
                                onChange={(e) => handleWeaknessChange(index, 'type', e.target.value)}
                                placeholder="Weakness type (e.g., Fire)"
                              />
                            </Col>
                            <Col md={5}>
                              <Form.Control
                                type="text"
                                value={weakness.value}
                                onChange={(e) => handleWeaknessChange(index, 'value', e.target.value)}
                                placeholder="Value (e.g., 5)"
                              />
                            </Col>
                            <Col md={2}>
                              <Button variant="outline-danger" size="sm" onClick={() => handleRemoveWeakness(index)}>
                                <Trash />
                              </Button>
                            </Col>
                          </Row>
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Attacks Section */}
                <CreatureAttackForm
                  attacks={newCreature.attacks}
                  onChange={attacks => setNewCreature(prev => ({ ...prev, attacks }))}
                  onAddAttack={handleAddAttack}
                  onRemoveAttack={handleRemoveAttack}
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
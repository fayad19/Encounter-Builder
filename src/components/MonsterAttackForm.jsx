import React from 'react';
import { Card, Row, Col, Form, Button } from 'react-bootstrap';
import { Trash, Plus } from 'react-bootstrap-icons';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

function CreatureAttackForm({ attacks, onChange, onAddAttack, onRemoveAttack }) {
  // Helper for attack change
  const handleAttackChange = (index, field, value) => {
    const updatedAttacks = [...attacks];
    updatedAttacks[index] = {
      ...updatedAttacks[index],
      [field]: value
    };
    onChange(updatedAttacks);
  };

  return (
    <>
      <div className="mb-3 d-flex gap-2">
        <Button variant="outline-primary" size="sm" type="button" onClick={() => onAddAttack('melee')}>
          <Plus /> Add Melee Attack
        </Button>
        <Button variant="outline-primary" size="sm" type="button" onClick={() => onAddAttack('ranged')}>
          <Plus /> Add Ranged Attack
        </Button>
        <Button variant="outline-primary" size="sm" type="button" onClick={() => onAddAttack('spell')}>
          <Plus /> Add Spell Attack
        </Button>
        <Button variant="outline-success" size="sm" type="button" onClick={() => onAddAttack('regularSpell')}>
          <Plus /> Add Regular Spell
        </Button>
      </div>
      {attacks.map((attack, index) => {
        // Count the number of each type up to this index
        const typeCounts = { melee: 0, ranged: 0, spell: 0, regularSpell: 0 };
        for (let i = 0; i <= index; i++) {
          const t = attacks[i].attackType;
          if (typeCounts[t] !== undefined) typeCounts[t]++;
        }
        let header = `Attack ${index + 1}`;
        if (attack.attackType === 'melee') header = `Melee Attack ${typeCounts.melee}`;
        else if (attack.attackType === 'ranged') header = `Ranged Attack ${typeCounts.ranged}`;
        else if (attack.attackType === 'spell') header = `Spell ${typeCounts.spell}`;
        else if (attack.attackType === 'regularSpell') header = `Regular Spell ${typeCounts.regularSpell}`;
        return (
          <Card key={index} className="mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">{header}</h6>
                {attacks.length > 1 && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onRemoveAttack(index)}
                  >
                    <Trash />
                  </Button>
                )}
              </div>
              {/* Melee/Ranged Attack Fields */}
              {(attack.attackType !== 'spell' && attack.attackType !== 'regularSpell') && (
                <>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Attack Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={attack.attackName}
                          onChange={(e) => handleAttackChange(index, 'attackName', e.target.value)}
                          placeholder="Enter attack name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Attack Type</Form.Label>
                        <Form.Control
                          type="text"
                          value={attack.attackType}
                          onChange={(e) => handleAttackChange(index, 'attackType', e.target.value)}
                          placeholder="Enter attack type"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>First Hit Modifier</Form.Label>
                        <Form.Control
                          type="number"
                          value={attack.firstHitModifier}
                          onChange={(e) => handleAttackChange(index, 'firstHitModifier', e.target.value)}
                          placeholder="Enter modifier"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Second Hit Modifier</Form.Label>
                        <Form.Control
                          type="number"
                          value={attack.secondHitModifier}
                          onChange={(e) => handleAttackChange(index, 'secondHitModifier', e.target.value)}
                          placeholder="Enter modifier"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Third Hit Modifier</Form.Label>
                        <Form.Control
                          type="number"
                          value={attack.thirdHitModifier}
                          onChange={(e) => handleAttackChange(index, 'thirdHitModifier', e.target.value)}
                          placeholder="Enter modifier"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-2">
                    <Form.Label>Damage</Form.Label>
                    <Form.Control
                      type="text"
                      value={attack.damage}
                      onChange={(e) => handleAttackChange(index, 'damage', e.target.value)}
                      placeholder="Enter damage"
                    />
                  </Form.Group>
                </>
              )}
              {/* Spell Attack Fields */}
              {attack.attackType === 'spell' && (
                <>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={attack.attackName}
                          onChange={e => handleAttackChange(index, 'attackName', e.target.value)}
                          placeholder="Enter spell name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Tradition</Form.Label>
                        <DropdownButton
                          id={`tradition-dropdown-${index}`}
                          title={
                            (attack.tradition && attack.tradition.length > 0)
                              ? attack.tradition.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')
                              : 'Select tradition(s)'
                          }
                          variant="outline-secondary"
                          className="w-100"
                        >
                          {['arcane', 'divine', 'occult', 'primal'].map(trad => (
                            <Dropdown.Item
                              key={trad}
                              as="button"
                              className="d-flex align-items-center"
                              onMouseDown={e => e.stopPropagation()}
                              onClick={e => {
                                e.preventDefault();
                                const current = attack.tradition || [];
                                if (current.includes(trad)) {
                                  handleAttackChange(index, 'tradition', current.filter(t => t !== trad));
                                } else {
                                  handleAttackChange(index, 'tradition', [...current, trad]);
                                }
                              }}
                            >
                              <Form.Check
                                type="checkbox"
                                checked={attack.tradition && attack.tradition.includes(trad)}
                                onMouseDown={e => e.stopPropagation()}
                                onChange={() => {}}
                                label={trad.charAt(0).toUpperCase() + trad.slice(1)}
                                className="me-2"
                              />
                            </Dropdown.Item>
                          ))}
                        </DropdownButton>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Actions</Form.Label>
                        <Form.Select
                          value={attack.actions || '1'}
                          onChange={e => handleAttackChange(index, 'actions', e.target.value)}
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={8}>
                      <Form.Group className="mb-2">
                        <Form.Label>Target(s) or Area</Form.Label>
                        <div className="d-flex align-items-center gap-2">
                          <Form.Check
                            type="radio"
                            label="Target(s)"
                            name={`targetArea${index}`}
                            checked={attack.targetOrArea === 'target'}
                            onChange={() => handleAttackChange(index, 'targetOrArea', 'target')}
                          />
                          {attack.targetOrArea === 'target' && (
                            <Form.Control
                              type="number"
                              min={1}
                              style={{ width: 60, fontSize: '0.9rem' }}
                              className="ms-1"
                              value={attack.targetCount || ''}
                              onChange={e => handleAttackChange(index, 'targetCount', e.target.value)}
                              placeholder="#"
                            />
                          )}
                          <Form.Check
                            type="radio"
                            label="Area"
                            name={`targetArea${index}`}
                            checked={attack.targetOrArea === 'area'}
                            onChange={() => handleAttackChange(index, 'targetOrArea', 'area')}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  {/* Area Type only when Area is selected */}
                  {attack.targetOrArea === 'area' && (
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Area Type</Form.Label>
                          <Form.Select
                            value={attack.areaType || ''}
                            onChange={e => handleAttackChange(index, 'areaType', e.target.value)}
                          >
                            <option value="" disabled>Select type</option>
                            <option value="emanation">Emanation</option>
                            <option value="burst">Burst</option>
                            <option value="cone">Cone</option>
                            <option value="line">Line</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Range</Form.Label>
                          <Form.Control
                            type="text"
                            value={attack.range || ''}
                            onChange={e => handleAttackChange(index, 'range', e.target.value)}
                            placeholder="Enter range"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                  {attack.targetOrArea === 'area' && (
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Save Type</Form.Label>
                          <Form.Select
                            value={attack.saveType || ''}
                            onChange={e => handleAttackChange(index, 'saveType', e.target.value)}
                          >
                            <option value="" disabled>Select save</option>
                            <option value="fortitude">Fortitude</option>
                            <option value="reflex">Reflex</option>
                            <option value="will">Will</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Spell DC</Form.Label>
                          <Form.Control
                            type="number"
                            value={attack.attackModifier || ''}
                            onChange={e => handleAttackChange(index, 'attackModifier', e.target.value)}
                            placeholder="Enter spell DC"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                  {/* Target(s) details */}
                  {attack.targetOrArea === 'target' && (
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Attack or Save</Form.Label>
                          <Form.Select
                            value={attack.attackOrSave || ''}
                            onChange={e => handleAttackChange(index, 'attackOrSave', e.target.value)}
                          >
                            <option value="" disabled>Select type</option>
                            <option value="attack">Attack</option>
                            <option value="save">Save</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        {attack.attackOrSave === 'attack' && (
                          <Form.Group className="mb-2">
                            <Form.Label>Attack Modifier</Form.Label>
                            <Form.Control
                              type="number"
                              value={attack.attackModifier || ''}
                              onChange={e => handleAttackChange(index, 'attackModifier', e.target.value)}
                              placeholder="Enter attack modifier"
                            />
                          </Form.Group>
                        )}
                        {attack.attackOrSave === 'save' && (
                          <>
                            <Form.Group className="mb-2">
                              <Form.Label>Spell DC</Form.Label>
                              <Form.Control
                                type="number"
                                value={attack.attackModifier || ''}
                                onChange={e => handleAttackChange(index, 'attackModifier', e.target.value)}
                                placeholder="Enter spell DC"
                              />
                            </Form.Group>
                            <Form.Group className="mb-2">
                              <Form.Label>Save Type</Form.Label>
                              <Form.Select
                                value={attack.saveType || ''}
                                onChange={e => handleAttackChange(index, 'saveType', e.target.value)}
                              >
                                <option value="" disabled>Select save</option>
                                <option value="fortitude">Fortitude</option>
                                <option value="reflex">Reflex</option>
                                <option value="will">Will</option>
                              </Form.Select>
                            </Form.Group>
                          </>
                        )}
                      </Col>
                    </Row>
                  )}
                </>
              )}
              {/* Regular Spell Fields */}
              {attack.attackType === 'regularSpell' && (
                <>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-2">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={attack.attackName || ''}
                          onChange={e => handleAttackChange(index, 'attackName', e.target.value)}
                          placeholder="Enter spell name"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-2">
                        <Form.Label>Actions</Form.Label>
                        <Form.Select
                          value={attack.actions || '1'}
                          onChange={e => handleAttackChange(index, 'actions', e.target.value)}
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-2">
                        <Form.Label>Range</Form.Label>
                        <Form.Control
                          type="text"
                          value={attack.range || ''}
                          onChange={e => handleAttackChange(index, 'range', e.target.value)}
                          placeholder="Enter range"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-2">
                        <Form.Label>Targets</Form.Label>
                        <Form.Control
                          type="text"
                          value={attack.targets || ''}
                          onChange={e => handleAttackChange(index, 'targets', e.target.value)}
                          placeholder="Enter targets"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-2">
                        <Form.Label>Duration</Form.Label>
                        <Form.Control
                          type="text"
                          value={attack.duration || ''}
                          onChange={e => handleAttackChange(index, 'duration', e.target.value)}
                          placeholder="Enter duration"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-2">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={attack.description || ''}
                      onChange={e => handleAttackChange(index, 'description', e.target.value)}
                      placeholder="Enter description"
                    />
                  </Form.Group>
                </>
              )}
            </Card.Body>
          </Card>
        );
      })}
    </>
  );
}

export default CreatureAttackForm; 
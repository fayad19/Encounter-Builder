import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, ListGroupItem, Badge } from 'react-bootstrap';
import { ArrowRight, Trash, Pencil, Plus } from 'react-bootstrap-icons';
import InitiativeDialog from './InitiativeDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import action1 from '../assets/action-1.png';
import action2 from '../assets/action-2.png';
import action3 from '../assets/action-3.png';
import CreatureAttackForm from './CreatureAttackForm';

function BattleTab({
  participants = [],
  onStartBattle,
  onFinishTurn,
  onEndBattle,
  onRemoveParticipant,
  onRemoveAllParticipants,
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
    setInitiativeInputValue(participant.initiative !== null && participant.initiative !== undefined ? participant.initiative : '');
  };

  const handleInitiativeChange = (e) => {
    setInitiativeInputValue(e.target.value);
  };

  const handleInitiativeBlurOrSave = (participant) => {
    const newValue = initiativeInputValue === '' ? null : Number(initiativeInputValue);
    setEditingInitiativeId(null);
    setInitiativeInputValue('');
    console.log('handleInitiativeBlurOrSave called for', participant.name, 'with newValue:', newValue);
    if (onUpdateParticipantInitiative) {
      // Check for tie
      const tiedParticipants = participants.filter(p => p.battleId !== participant.battleId && p.initiative === newValue);
      if (tiedParticipants.length > 0) {
        // Use competitive selection modal for inline edit
        if (typeof onInitiativeTie === 'function') {
          // Set the tie state in the parent (App.jsx)
          onInitiativeTie({ participant, tiedParticipants, newValue, inline: true });
        }
        return;
      }
      console.log('Calling onUpdateParticipantInitiative with', participant.battleId, newValue);
      onUpdateParticipantInitiative(participant.battleId, newValue);
    }
  };

  const handleHpInputChange = (battleId, value) => {
    setHpInputValues(prev => ({ ...prev, [battleId]: value }));
  };

  const handleHpDeduct = (participant) => {
    const value = Number(hpInputValues[participant.battleId]);
    if (!isNaN(value) && value !== 0) {
      if (onUpdateParticipantHP) {
        console.log('Calling onUpdateParticipantHP for', participant.name, 'with new HP:', (Number(participant.hp) || 0) - value);
        onUpdateParticipantHP(participant.battleId, (Number(participant.hp) || 0) - value);
      }
      setHpInputValues(prev => ({ ...prev, [participant.battleId]: '' }));
    }
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

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <h5 className="mb-0">Battle</h5>
                <span className="badge bg-secondary">Round: {currentRound}</span>
              </div>
              <div className="d-flex gap-2">
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
                      onClick={onFinishTurn}
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
                <ListGroupItem
                  key={participant.battleId}
                  className={`d-flex justify-content-between align-items-center ${currentTurn === participant.battleId ? 'highlighted-turn' : ''
                    } ${Number(participant.hp) <= 0 ? 'hp-below-zero' : ''
                    } ${currentTurn === participant.battleId && Number(participant.hp) <= 0 ? 'hp-below-zero-highlighted' : ''
                    }`}
                >
                  <div className="d-flex flex-column">
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
                            HP: {participant.hp}
                            <span className="ms-2">
                              AC: {participant.ac}</span>
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
                            <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                              Fortitude: {participant.fortitude}
                              <span className="ms-2">
                                Reflex: {participant.reflex}
                              </span>
                              Will: {participant.will}
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
                                          {atk.attackName} {[
                                            atk.firstHitModifier,
                                            atk.secondHitModifier,
                                            atk.thirdHitModifier
                                          ].filter(Boolean).join('/')} {atk.damage ? `(${atk.damage})` : ''}
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
                                          {atk.attackName} {[
                                            atk.firstHitModifier,
                                            atk.secondHitModifier,
                                            atk.thirdHitModifier
                                          ].filter(Boolean).join('/')} {atk.damage ? `(${atk.damage})` : ''}
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
                                          <span className="text-muted">[spell]</span> {atk.attackName}
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
                                            {atk.attackOrSave === 'attack' && `, Attack Modifier: ${atk.attackModifier}`}
                                            {atk.attackOrSave === 'save' && `, Save: ${atk.saveType || ''} DC ${atk.attackModifier || ''}`}
                                            {atk.damage && `, Damage: ${atk.damage}`}
                                            {/* {atk.tradition && atk.tradition.length > 0 && `, Tradition: ${atk.tradition.join(', ')}`} */}
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
                            HP: {participant.hp || 0}
                            <span className="ms-2">AC: {participant.ac || 0}</span>
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
                        </div>
                      )}
                    </div>
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
                      <input type="number" className="form-control" value={creatureToEdit.hp} onChange={e => handleEditCreatureChange('hp', e.target.value)} />
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
    </Container>
  );
}

export default BattleTab; 
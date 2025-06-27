import React, { useState } from 'react';
import { Modal, Table, Button, Dropdown } from 'react-bootstrap';

function SpellDetailModal({ spell, show, onHide, onAddSpell, savedCreatures }) {
  const [showCreatureDropdown, setShowCreatureDropdown] = useState(false);

  if (!spell) return null;

  // Helper function to clean up spell descriptions and handle UUID references
  const processDescription = (description) => {
    if (!description) return '';
    
    // Remove HTML tags
    let processed = description.replace(/<\/?[^>]+(>|$)/g, '');
    
    // Convert markdown-style formatting
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\n/g, '<br />');
    
    return processed;
  };

  const handleSpellReferenceClick = (event) => {
    if (event.target.classList.contains('spell-reference')) {
      event.preventDefault();
      const type = event.target.getAttribute('data-type');
      const id = event.target.getAttribute('data-id');
      // TODO: Implement spell reference lookup
      console.log('Looking up:', type, id);
    }
  };

  const renderTraits = () => {
    const traits = spell.traits || [];
    return traits.map((trait, index) => (
      <span key={`${spell.id}-trait-${index}`} className="badge bg-secondary me-1">{trait}</span>
    ));
  };

  const renderTableRows = () => {
    const rows = [];
    
    if (spell.oldName) {
      rows.push(
        <tr key={`${spell.id}-old-name`}>
          <td>Previous Name</td>
          <td><em>{spell.oldName}</em></td>
        </tr>
      );
    }

    if (spell.cast) {
      rows.push(
        <tr key={`${spell.id}-cast`}>
          <td>Cast</td>
          <td>{spell.cast}</td>
        </tr>
      );
    }
    
    if (spell.range) {
      rows.push(
        <tr key={`${spell.id}-range`}>
          <td>Range</td>
          <td>{spell.range}</td>
        </tr>
      );
    }
    
    if (spell.area) {
      rows.push(
        <tr key={`${spell.id}-area`}>
          <td>Area</td>
          <td>{spell.area}</td>
        </tr>
      );
    }
    
    if (spell.targets) {
      rows.push(
        <tr key={`${spell.id}-target`}>
          <td>Targets</td>
          <td>{spell.targets}</td>
        </tr>
      );
    }
    
    if (spell.duration) {
      rows.push(
        <tr key={`${spell.id}-duration`}>
          <td>Duration</td>
          <td>{spell.duration}</td>
        </tr>
      );
    }

    if (spell.traditions && spell.traditions.length > 0) {
      rows.push(
        <tr key={`${spell.id}-traditions`}>
          <td>Traditions</td>
          <td>{spell.traditions.join(', ')}</td>
        </tr>
      );
    }

    if (spell.components && spell.components.length > 0) {
      rows.push(
        <tr key={`${spell.id}-components`}>
          <td>Components</td>
          <td>{spell.components.join(', ')}</td>
        </tr>
      );
    }
    
    return rows;
  };

  const handleAddSpellToCreature = (creature) => {
    // Convert spell to attack format
    const isAttackSpell = spell.traits?.includes('attack') || 
                         spell.description?.toLowerCase().includes('spell attack') ||
                         spell.description?.toLowerCase().includes('ranged attack') ||
                         spell.description?.toLowerCase().includes('melee attack');

    const spellAttack = {
      id: Date.now(),
      attackName: spell.name,
      attackType: isAttackSpell ? 'spell' : 'regularSpell',
      attackCategory: isAttackSpell ? 'spell' : 'regularSpell',
      actions: spell.cast?.includes('1') ? '1' : spell.cast?.includes('2') ? '2' : spell.cast?.includes('3') ? '3' : '2',
      range: spell.range || '',
      description: spell.description || '',
      targetOrArea: spell.area ? 'area' : 'target',
      area: spell.area || '',
      duration: spell.duration || '',
      targets: spell.targets || ''
    };

    // Add spell to creature
    const updatedCreature = {
      ...creature,
      attacks: [...(creature.attacks || []), spellAttack]
    };

    onAddSpell(updatedCreature);
    setShowCreatureDropdown(false);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {spell.name} <small className="text-muted">Level {spell.level}</small>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body onClick={handleSpellReferenceClick}>
        <div className="mb-2">
          {renderTraits()}
        </div>

        <Table striped bordered>
          <tbody>
            {renderTableRows()}
          </tbody>
        </Table>

        <div 
          className="spell-description"
          dangerouslySetInnerHTML={{ __html: processDescription(spell.description) }}
        />

      </Modal.Body>
      <Modal.Footer>
        {showCreatureDropdown ? (
          <Dropdown>
            <Dropdown.Toggle variant="primary">
              Select Creature
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {savedCreatures?.map((creature) => (
                <Dropdown.Item 
                  key={creature.id} 
                  onClick={() => handleAddSpellToCreature(creature)}
                >
                  {creature.name}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        ) : (
          <Button variant="primary" onClick={() => setShowCreatureDropdown(true)}>
            Add to Creature
          </Button>
        )}
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default SpellDetailModal; 
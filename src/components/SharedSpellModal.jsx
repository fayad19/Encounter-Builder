import React from 'react';
import { Modal, Table, Button } from 'react-bootstrap';
import { getSpellBySlug } from '../services/spellDB';

function SharedSpellModal({ spell, show, onHide }) {
  if (!spell) return null;

  const renderTraits = () => {
    const traits = spell.system.traits?.value || [];
    return traits.map(trait => (
      <span key={trait} className="badge bg-secondary me-1">{trait}</span>
    ));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {spell.name} <small className="text-muted">Level {spell.system.level.value}</small>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-2">
          {renderTraits()}
        </div>

        <Table striped bordered>
          <tbody>
            {spell.system.time?.value && (
              <tr>
                <td>Cast</td>
                <td>{spell.system.time.value}</td>
              </tr>
            )}
            {spell.system.range?.value && (
              <tr>
                <td>Range</td>
                <td>{spell.system.range.value}</td>
              </tr>
            )}
            {spell.system.area && (
              <tr>
                <td>Area</td>
                <td>{spell.system.area.value}-foot {spell.system.area.type}</td>
              </tr>
            )}
            {spell.system.target?.value && (
              <tr>
                <td>Targets</td>
                <td>{spell.system.target.value}</td>
              </tr>
            )}
            {spell.system.duration?.value && (
              <tr>
                <td>Duration</td>
                <td>{spell.system.duration.value}</td>
              </tr>
            )}
          </tbody>
        </Table>

        <div 
          className="spell-description"
          dangerouslySetInnerHTML={{ __html: spell.system.description?.value }}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default SharedSpellModal; 
import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

function InitiativeDialog({ open, onClose, onConfirm, participant }) {
  const [initiative, setInitiative] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (initiative) {
      onConfirm(Number(initiative));
      setInitiative('');
    }
  };

  return (
    <Modal show={open} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Enter Initiative</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Initiative for {participant?.name}</Form.Label>
            <Form.Control
              type="number"
              value={initiative}
              onChange={(e) => setInitiative(e.target.value)}
              placeholder="Enter initiative roll"
              autoFocus
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!initiative}>
            Confirm
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default InitiativeDialog; 
import React from 'react';
import { Modal, Button } from 'react-bootstrap';

function DeleteConfirmationDialog({ open, onClose, onConfirm, title, message }) {
  return (
    <Modal show={open} onHide={onClose} centered>
      <form onSubmit={e => { e.preventDefault(); onConfirm(); }}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {message}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" autoFocus>
            Finish Battle
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

export default DeleteConfirmationDialog; 
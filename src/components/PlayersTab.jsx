import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup, ListGroupItem } from 'react-bootstrap';
import { Plus, Pencil, Trash } from 'react-bootstrap-icons';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

function PlayersTab({ players = [], onAddPlayer, onUpdatePlayer, onDeletePlayer, onAddToBattle }) {
  const [newPlayer, setNewPlayer] = useState({ name: '', hp: '', ac: '' });
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPlayer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPlayer.name) {
      if (editingPlayer) {
        onUpdatePlayer(editingPlayer.id, newPlayer);
        setEditingPlayer(null);
      } else {
        onAddPlayer({ ...newPlayer, id: Date.now() });
      }
      setNewPlayer({ name: '', hp: '', ac: '' });
    }
  };

  const handleEditClick = (player) => {
    setNewPlayer({ name: player.name, hp: player.hp || '', ac: player.ac || '' , level: player.level || ''});
    setEditingPlayer(player);
  };

  const handleCancelEdit = () => {
    setEditingPlayer(null);
    setNewPlayer({ name: '', hp: '', ac: '' , level: ''});
  };

  const handleDeleteClick = (player) => {
    setPlayerToDelete(player);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (playerToDelete) {
      onDeletePlayer(playerToDelete.id);
      setDeleteDialogOpen(false);
      setPlayerToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPlayerToDelete(null);
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col md={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">{editingPlayer ? 'Edit Player' : 'Add New Player'}</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Player Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={newPlayer.name}
                    onChange={handleInputChange}
                    placeholder="Enter player name"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>HP</Form.Label>
                  <Form.Control
                    type="number"
                    name="hp"
                    value={newPlayer.hp}
                    onChange={handleInputChange}
                    placeholder="Enter HP"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>AC</Form.Label>
                  <Form.Control
                    type="number"
                    name="ac"
                    value={newPlayer.ac}
                    onChange={handleInputChange}
                    placeholder="Enter AC"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Level</Form.Label>
                  <Form.Control
                    type="number"
                    name="level"
                    value={newPlayer.level}
                    onChange={handleInputChange}
                    placeholder="Enter Level"
                  />
                </Form.Group>
                <div className="d-flex gap-2">
                  <Button variant="primary" type="submit" disabled={!newPlayer.name}>
                    {editingPlayer ? 'Save Changes' : 'Add Player'}
                  </Button>
                  {editingPlayer && (
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
              <h5 className="mb-0">Saved Players</h5>
            </Card.Header>
            <ListGroup variant="flush">
              {players.map((player) => (
                <ListGroupItem key={player.id} className="d-flex justify-content-between align-items-center">
                  <span>
                    {player.name}
                    <span className="ms-2 text-muted small">HP: {player.hp || 0} | AC: {player.ac || 0}</span>
                  </span>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => onAddToBattle({ ...player, type: 'player' })}
                    >
                      <Plus />
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleEditClick(player)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteClick(player)}
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
        title="Delete Player"
        message={`Are you sure you want to delete ${playerToDelete?.name || 'this player'}?`}
      />
    </Container>
  );
}

export default PlayersTab; 
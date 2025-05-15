import React from 'react';
import { Container, Row, Col, Card, ListGroup, ListGroupItem, Button } from 'react-bootstrap';
import { Trash } from 'react-bootstrap-icons';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

function ParticipantsTab({ 
  participants = [], 
  onRemoveParticipant, 
  onRemoveAllParticipants,
  onRemoveAllPlayers,
  onRemoveAllCreatures,
  onRemoveAllSavedCreatures,
  onRemoveAllSavedPlayers
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [participantToDelete, setParticipantToDelete] = React.useState(null);

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

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Battle Participants</h5>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={onRemoveAllParticipants}
                >
                  <Trash /> Remove All
                </Button>
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={onRemoveAllPlayers}
                >
                  <Trash /> Remove All Players
                </Button>
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={onRemoveAllCreatures}
                >
                  <Trash /> Remove All Creatures
                </Button>
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={onRemoveAllSavedCreatures}
                >
                  <Trash /> Remove All Saved Creatures
                </Button>
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={onRemoveAllSavedPlayers}
                >
                  <Trash /> Remove All Saved Players
                </Button>
              </div>
            </Card.Header>
            <ListGroup variant="flush">
              {participants.map((participant) => (
                <ListGroupItem 
                  key={participant.battleId}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <strong>{participant.name}</strong>
                    {participant.initiative !== null && (
                      <span className="ms-2">(Initiative: {participant.initiative})</span>
                    )}
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteClick(participant)}
                  >
                    <Trash />
                  </Button>
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
    </Container>
  );
}

export default ParticipantsTab; 
import React, { useState } from 'react';
import { Box, TextField, Button, Grid, Paper, Typography, List, ListItem, ListItemText, Divider, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

function ParticipantsTab({ participants, onAddParticipant, onDeleteParticipant }) {
  const [newParticipant, setNewParticipant] = useState({ name: '', initiative: '' });
  const [editingParticipant, setEditingParticipant] = useState(null);

  const handleAddParticipant = () => {
    if (newParticipant.name && newParticipant.initiative) {
      onAddParticipant({ ...newParticipant, id: Date.now() });
      setNewParticipant({ name: '', initiative: '' });
    }
  };

  const handleEditParticipant = (participant) => {
    setEditingParticipant(participant);
  };

  const handleSaveEdit = () => {
    if (editingParticipant.name && editingParticipant.initiative) {
      onAddParticipant({ ...editingParticipant, id: Date.now() });
      setEditingParticipant(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingParticipant(null);
  };

  // Sort participants by initiative (highest to lowest)
  const sortedParticipants = [...participants].sort((a, b) => 
    parseInt(b.initiative) - parseInt(a.initiative)
  );

  return (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        {/* Participant Input Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Add Participant
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Name"
                value={newParticipant.name}
                onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
              />
              <TextField
                label="Initiative"
                type="number"
                value={newParticipant.initiative}
                onChange={(e) => setNewParticipant({ ...newParticipant, initiative: e.target.value })}
              />
              <Button 
                variant="contained" 
                onClick={handleAddParticipant}
                disabled={!newParticipant.name || !newParticipant.initiative}
              >
                Add
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Participants List */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Initiative Order
            </Typography>
            <List>
              {sortedParticipants.map((participant) => (
                <React.Fragment key={participant.id}>
                  <ListItem
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          edge="end" 
                          color="primary"
                          onClick={() => handleEditParticipant(participant)}
                          title="Edit"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          color="error"
                          onClick={() => onDeleteParticipant(participant.id)}
                          title="Delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                    sx={{ pr: 12 }} // Increased padding to prevent text overlap with buttons
                  >
                    {editingParticipant?.id === participant.id ? (
                      <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                        <TextField
                          size="small"
                          label="Name"
                          value={editingParticipant.name}
                          onChange={(e) => setEditingParticipant({ ...editingParticipant, name: e.target.value })}
                        />
                        <TextField
                          size="small"
                          label="Initiative"
                          type="number"
                          value={editingParticipant.initiative}
                          onChange={(e) => setEditingParticipant({ ...editingParticipant, initiative: e.target.value })}
                        />
                        <TextField
                          size="small"
                          label="Status"
                          value={editingParticipant.status || ''}
                          onChange={(e) => setEditingParticipant({ ...editingParticipant, status: e.target.value })}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            color="primary"
                            onClick={handleSaveEdit}
                            title="Save"
                          >
                            <SaveIcon />
                          </IconButton>
                          <IconButton 
                            color="error"
                            onClick={handleCancelEdit}
                            title="Cancel"
                          >
                            <CancelIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    ) : (
                      <ListItemText
                        primary={participant.name}
                        secondary={`Initiative: ${participant.initiative}${participant.status ? ` | Status: ${participant.status}` : ''}`}
                      />
                    )}
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ParticipantsTab; 
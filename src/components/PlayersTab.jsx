import React, { useState } from 'react';
import { Box, TextField, Button, Grid, Paper, Typography, List, ListItem, ListItemText, Divider, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

function PlayersTab({ players, onAddPlayer, onDeletePlayer }) {
  const [newPlayer, setNewPlayer] = useState({ name: '' });
  const [editingPlayer, setEditingPlayer] = useState(null);

  const handleAddPlayer = () => {
    if (newPlayer.name) {
      onAddPlayer({ ...newPlayer, id: Date.now() });
      setNewPlayer({ name: '' });
    }
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
  };

  const handleSaveEdit = () => {
    if (editingPlayer.name) {
      onAddPlayer({ ...editingPlayer, id: Date.now() });
      setEditingPlayer(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingPlayer(null);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Add New Player
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Player Name"
              value={newPlayer.name}
              onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button 
              variant="contained" 
              onClick={handleAddPlayer}
              disabled={!newPlayer.name}
            >
              Add Player
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Player List
        </Typography>
        <List>
          {players.map((player) => (
            <React.Fragment key={player.id}>
              <ListItem
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton 
                      edge="end" 
                      color="primary"
                      onClick={() => handleEditPlayer(player)}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      color="error"
                      onClick={() => onDeletePlayer(player.id)}
                      title="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
                sx={{ pr: 12 }}
              >
                {editingPlayer?.id === player.id ? (
                  <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                    <TextField
                      size="small"
                      label="Name"
                      value={editingPlayer.name}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
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
                    primary={player.name}
                  />
                )}
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
}

export default PlayersTab; 
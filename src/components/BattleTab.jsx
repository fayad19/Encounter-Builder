import React, { useState } from 'react';
import { Box, TextField, Button, Grid, Paper, Typography, List, ListItem, ListItemText, Card, CardContent, CardHeader, Divider, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SkipNextIcon from '@mui/icons-material/SkipNext';

function BattleTab({ 
  participants, 
  onAddParticipant, 
  monsters, 
  onUpdateMonster, 
  currentTurn, 
  battleStarted, 
  onStartBattle, 
  onFinishTurn,
  setBattleStarted,
  setCurrentTurn,
  players,
  battleMonsters,
  onEndBattle,
  onRemoveMonster
}) {
  const [newParticipant, setNewParticipant] = useState({ name: '', initiative: '' });
  const [statuses, setStatuses] = useState([]);
  const [editingMonster, setEditingMonster] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    level: '',
    hp: '',
    ac: '',
    fortitude: '',
    reflex: '',
    will: '',
    perception: '',
    speed: '',
    abilities: '',
    skills: '',
    items: '',
    spells: '',
    description: ''
  });

  const handleAddParticipant = () => {
    if (newParticipant.name && newParticipant.initiative) {
      onAddParticipant({ ...newParticipant, id: Date.now() });
      setNewParticipant({ name: '', initiative: '' });
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(statuses);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setStatuses(items);
  };

  const handleEditClick = (monster) => {
    setEditingMonster(monster);
    setEditForm({
      name: monster.name || '',
      level: monster.level || '',
      hp: monster.hp || '',
      ac: monster.ac || '',
      fortitude: monster.fortitude || '',
      reflex: monster.reflex || '',
      will: monster.will || '',
      perception: monster.perception || '',
      speed: monster.speed || '',
      abilities: monster.abilities || '',
      skills: monster.skills || '',
      items: monster.items || '',
      spells: monster.spells || '',
      description: monster.description || ''
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSave = () => {
    if (editingMonster) {
      onUpdateMonster({
        ...editingMonster,
        ...editForm
      });
      setEditingMonster(null);
    }
  };

  const handleEditCancel = () => {
    setEditingMonster(null);
  };

  const handleAttackChange = (index, field, value) => {
    setEditingMonster(prev => ({
      ...prev,
      attacks: prev.attacks.map((attack, i) => 
        i === index ? { ...attack, [field]: value } : attack
      )
    }));
  };

  const handleAddAttack = () => {
    setEditingMonster(prev => ({
      ...prev,
      attacks: [
        ...prev.attacks,
        {
          id: Date.now(),
          attackName: '',
          firstHitModifier: '',
          secondHitModifier: '',
          thirdHitModifier: '',
          attackType: '',
          damage: ''
        }
      ]
    }));
  };

  const handleRemoveAttack = (index) => {
    setEditingMonster(prev => ({
      ...prev,
      attacks: prev.attacks.filter((_, i) => i !== index)
    }));
  };

  // Sort participants by initiative (highest to lowest)
  const sortedParticipants = [...participants].sort((a, b) => 
    parseInt(b.initiative) - parseInt(a.initiative)
  );

  return (
    <Box sx={{ mt: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Battle Controls
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {!battleStarted ? (
            <Button 
              variant="contained" 
              color="primary"
              onClick={onStartBattle}
              disabled={players.length === 0 && battleMonsters.length === 0}
            >
              Start Battle
            </Button>
          ) : (
            <>
              <Button 
                variant="contained" 
                color="primary"
                onClick={onFinishTurn}
                disabled={!currentTurn}
              >
                Finish Turn
              </Button>
              <Button 
                variant="outlined" 
                color="error"
                onClick={onEndBattle}
              >
                End Battle
              </Button>
            </>
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Initiative Order
        </Typography>
        <List>
          {sortedParticipants.map((participant) => (
            <ListItem 
              key={participant.battleId}
              sx={{ 
                bgcolor: currentTurn === participant.battleId ? 'action.selected' : 'inherit',
                borderRadius: 1,
                mb: 1,
                border: currentTurn === participant.battleId ? '2px solid #1976d2' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {participant.name} {participant.type === 'monster' ? `(Level ${participant.level})` : ''}
                </Typography>
                {participant.type === 'monster' && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      HP: {participant.hp} | AC: {participant.ac} | Initiative: {participant.initiative}
                    </Typography>
                    {participant.attacks && participant.attacks.map((attack, index) => (
                      <Box key={attack.id} sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          <strong>{attack.attackName}</strong> ({attack.attackType})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Modifiers: {attack.firstHitModifier}/{attack.secondHitModifier}/{attack.thirdHitModifier} | Damage: {attack.damage}
                        </Typography>
                      </Box>
                    ))}
                    {participant.penalty && (
                      <Typography variant="body2" color="error">
                        Penalty: {participant.penalty}
                      </Typography>
                    )}
                  </Box>
                )}
                {participant.type === 'player' && (
                  <Typography variant="body2" color="text.secondary">
                    Initiative: {participant.initiative}
                  </Typography>
                )}
              </Paper>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Monster Cards Section */}
      <Typography variant="h6" gutterBottom>
        Monster Information
      </Typography>
      <Grid container spacing={2}>
        {monsters.map((monster) => (
          <Grid item xs={12} sm={6} key={monster.id}>
            <Card>
              <CardHeader 
                title={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">{monster.name}</Typography>
                    <Box>
                      <IconButton onClick={() => handleEditClick(monster)} size="small" sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => onRemoveMonster(monster.id)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                }
                subheader={
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                      AC: {monster.ac} | HP: {monster.hp}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                      Perception: +{monster.perception} | Speed: {monster.speed}ft
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                      Fort: +{monster.fortitude} | Ref: +{monster.reflex} | Will: +{monster.will}
                    </Typography>
                  </Box>
                }
              />
              <Divider />
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '1.1rem' }}>
                  Abilities
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                  {monster.abilities}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '1.1rem', mt: 2 }}>
                  Skills
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                  {monster.skills}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '1.1rem', mt: 2 }}>
                  Items
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                  {monster.items}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '1.1rem', mt: 2 }}>
                  Spells
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                  {monster.spells}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '1.1rem', mt: 2 }}>
                  Description
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                  {monster.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={!!editingMonster} onClose={handleEditCancel} maxWidth="md" fullWidth>
        <DialogTitle>Edit Monster</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <TextField
              name="name"
              label="Name"
              value={editForm.name}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              name="level"
              label="Level"
              type="number"
              value={editForm.level}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              name="hp"
              label="HP"
              type="number"
              value={editForm.hp}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              name="ac"
              label="AC"
              type="number"
              value={editForm.ac}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              name="fortitude"
              label="Fortitude"
              type="number"
              value={editForm.fortitude}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              name="reflex"
              label="Reflex"
              type="number"
              value={editForm.reflex}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              name="will"
              label="Will"
              type="number"
              value={editForm.will}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              name="perception"
              label="Perception"
              type="number"
              value={editForm.perception}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              name="speed"
              label="Speed"
              type="number"
              value={editForm.speed}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              name="abilities"
              label="Abilities"
              value={editForm.abilities}
              onChange={handleEditChange}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              name="skills"
              label="Skills"
              value={editForm.skills}
              onChange={handleEditChange}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              name="items"
              label="Items"
              value={editForm.items}
              onChange={handleEditChange}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              name="spells"
              label="Spells"
              value={editForm.spells}
              onChange={handleEditChange}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              name="description"
              label="Description"
              value={editForm.description}
              onChange={handleEditChange}
              multiline
              rows={4}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BattleTab; 
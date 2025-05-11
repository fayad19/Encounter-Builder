import React, { useState } from 'react';
import { Box, TextField, Button, Grid, Paper, Typography, List, ListItem, ListItemText, Divider, IconButton, ListItemSecondaryAction } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';

function MonstersTab({ onAddMonster, onAddMonsterToBattle, onUpdateMonster, monsters = [] }) {
  const [newMonster, setNewMonster] = useState({
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
    description: '',
    penalty: '',
    attacks: [
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
  });

  const [editingMonster, setEditingMonster] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMonster(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAttackChange = (index, field, value) => {
    setNewMonster(prev => ({
      ...prev,
      attacks: prev.attacks.map((attack, i) => 
        i === index ? { ...attack, [field]: value } : attack
      )
    }));
  };

  const handleEditClick = (monster) => {
    setNewMonster({
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
      description: monster.description || '',
      penalty: monster.penalty || '',
      attacks: monster.attacks || [
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
    });
    setEditingMonster(monster);
  };

  const handleCancelEdit = () => {
    setEditingMonster(null);
    setNewMonster({
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
      description: '',
      penalty: '',
      attacks: [
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
    });
  };

  const handleAddMonster = () => {
    if (newMonster.name) {
      if (editingMonster) {
        onUpdateMonster({
          ...editingMonster,
          ...newMonster
        });
        setEditingMonster(null);
      } else {
        onAddMonster({ ...newMonster, id: Date.now() });
      }
      setNewMonster({
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
        description: '',
        penalty: '',
        attacks: [
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
      });
    }
  };

  const handleAddAttack = () => {
    setNewMonster(prev => ({
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
    setNewMonster(prev => ({
      ...prev,
      attacks: prev.attacks.filter((_, i) => i !== index)
    }));
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {editingMonster ? 'Edit Monster' : 'Monster Information'}
            </Typography>
            
            {/* Basic Information */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Monster Name"
                  name="name"
                  value={newMonster.name}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Health"
                  name="hp"
                  type="number"
                  value={newMonster.hp}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Armor Class"
                  name="ac"
                  type="number"
                  value={newMonster.ac}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Speed"
                  name="speed"
                  type="number"
                  value={newMonster.speed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Perception"
                  name="perception"
                  type="number"
                  value={newMonster.perception}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Fortitude"
                  name="fortitude"
                  type="number"
                  value={newMonster.fortitude}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Reflex"
                  name="reflex"
                  type="number"
                  value={newMonster.reflex}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Will"
                  name="will"
                  type="number"
                  value={newMonster.will}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Level"
                  name="level"
                  type="number"
                  value={newMonster.level}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Abilities"
                  name="abilities"
                  value={newMonster.abilities}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Skills"
                  name="skills"
                  value={newMonster.skills}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Items"
                  name="items"
                  value={newMonster.items}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Spells"
                  name="spells"
                  value={newMonster.spells}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={newMonster.description}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Penalty"
                  name="penalty"
                  type="number"
                  value={newMonster.penalty}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>

            {/* Attacks Section */}
            <Typography variant="h6" gutterBottom>
              Attacks
            </Typography>
            {newMonster.attacks.map((attack, index) => (
              <Paper key={attack.id} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">Attack {index + 1}</Typography>
                  {newMonster.attacks.length > 1 && (
                    <IconButton onClick={() => handleRemoveAttack(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Attack Name"
                      value={attack.attackName}
                      onChange={(e) => handleAttackChange(index, 'attackName', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Attack Type"
                      value={attack.attackType}
                      onChange={(e) => handleAttackChange(index, 'attackType', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="First Hit Modifier"
                      type="number"
                      value={attack.firstHitModifier}
                      onChange={(e) => handleAttackChange(index, 'firstHitModifier', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Second Hit Modifier"
                      type="number"
                      value={attack.secondHitModifier}
                      onChange={(e) => handleAttackChange(index, 'secondHitModifier', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Third Hit Modifier"
                      type="number"
                      value={attack.thirdHitModifier}
                      onChange={(e) => handleAttackChange(index, 'thirdHitModifier', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Damage"
                      value={attack.damage}
                      onChange={(e) => handleAttackChange(index, 'damage', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={handleAddAttack}
              sx={{ mb: 2 }}
            >
              Add Attack
            </Button>

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddMonster}
                disabled={!newMonster.name}
              >
                {editingMonster ? 'Save Changes' : 'Add Monster'}
              </Button>
              {editingMonster && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Saved Monsters List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Saved Monsters
            </Typography>
            <List>
              {monsters.map((savedMonster) => (
                <React.Fragment key={savedMonster.id}>
                  <ListItem
                    secondaryAction={
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="edit"
                          onClick={() => handleEditClick(savedMonster)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="add to battle"
                          onClick={() => onAddMonsterToBattle(savedMonster)}
                        >
                          <AddCircleIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    }
                  >
                    <ListItemText
                      primary={savedMonster.name}
                      secondary={`Level ${savedMonster.level} | HP: ${savedMonster.hp} | AC: ${savedMonster.ac}`}
                    />
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

export default MonstersTab; 
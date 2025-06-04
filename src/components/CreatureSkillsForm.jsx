import React from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { Plus, Trash } from 'react-bootstrap-icons';

const SKILL_OPTIONS = [
  'Acrobatics',
  'Arcana',
  'Athletics',
  'Crafting',
  'Deception',
  'Diplomacy',
  'Intimidation',
  'Lore',
  'Medicine',
  'Nature',
  'Occultism',
  'Performance',
  'Religion',
  'Society',
  'Stealth',
  'Survival',
  'Thievery'
];

function CreatureSkillsForm({ skills = {}, onChange }) {
  const handleSkillChange = (skillName, value) => {
    const newSkills = { ...skills };
    if (value === '') {
      delete newSkills[skillName];
    } else {
      newSkills[skillName] = parseInt(value, 10);
    }
    onChange(newSkills);
  };

  const handleAddSkill = () => {
    const newSkills = { ...skills };
    // Find the first skill that isn't already in the list
    const availableSkill = SKILL_OPTIONS.find(skill => !newSkills.hasOwnProperty(skill));
    if (availableSkill) {
      newSkills[availableSkill] = 0;
      onChange(newSkills);
    }
  };

  const handleRemoveSkill = (skillName) => {
    const newSkills = { ...skills };
    delete newSkills[skillName];
    onChange(newSkills);
  };

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Skills</h6>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={handleAddSkill}
          disabled={Object.keys(skills).length >= SKILL_OPTIONS.length}
        >
          <Plus /> Add Skill
        </Button>
      </Card.Header>
      <Card.Body>
        <div className="row">
          {Object.entries(skills).map(([skillName, skillData]) => {
            const isObject = typeof skillData === 'object' && skillData !== null;
            const value = isObject ? skillData.value : skillData;
            const special = isObject && skillData.special ? skillData.special : [];
            const updateSpecial = (idx, field, newValue) => {
              const updatedSpecial = special.map((sp, i) =>
                i === idx ? { ...sp, [field]: field === 'base' ? parseInt(newValue, 10) : newValue } : sp
              );
              onChange({
                ...skills,
                [skillName]: { ...skillData, value, special: updatedSpecial }
              });
            };
            const addSpecial = () => {
              const updatedSpecial = [...special, { label: '', base: 0 }];
              onChange({
                ...skills,
                [skillName]: { ...skillData, value, special: updatedSpecial }
              });
            };
            const removeSpecial = (idx) => {
              const updatedSpecial = special.filter((_, i) => i !== idx);
              onChange({
                ...skills,
                [skillName]: { ...skillData, value, special: updatedSpecial }
              });
            };
            return (
              <div key={skillName} className="col-md-4 mb-2">
                <div className="d-flex align-items-center">
                  <Form.Group className="flex-grow-1 me-2">
                    <Form.Label>{skillName.charAt(0).toUpperCase() + skillName.slice(1)}</Form.Label>
                    <Form.Control
                      type="number"
                      value={value}
                      onChange={(e) => {
                        if (isObject) {
                          onChange({
                            ...skills,
                            [skillName]: { ...skillData, value: parseInt(e.target.value, 10), special }
                          });
                        } else {
                          handleSkillChange(skillName, e.target.value);
                        }
                      }}
                      placeholder="Modifier"
                    />
                    {special.length > 0 && (
                      <div className="mt-1 small">
                        {special.map((sp, idx) => (
                          <div key={idx} className="d-flex align-items-center mb-1">
                            <Form.Control
                              type="text"
                              value={sp.label || ''}
                              onChange={e => updateSpecial(idx, 'label', e.target.value)}
                              placeholder="Label (e.g. to Squeeze)"
                              className="me-1"
                              size="sm"
                            />
                            <Form.Control
                              type="number"
                              value={sp.base}
                              onChange={e => updateSpecial(idx, 'base', e.target.value)}
                              placeholder="Value"
                              className="me-1"
                              size="sm"
                              style={{ width: 70 }}
                            />
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeSpecial(idx)}
                              tabIndex={-1}
                            >
                              <Trash />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outline-success"
                      size="sm"
                      className="mt-1"
                      onClick={addSpecial}
                    >
                      + Add Special
                    </Button>
                  </Form.Group>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="mt-4"
                    onClick={() => handleRemoveSkill(skillName)}
                  >
                    <Trash />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        {Object.keys(skills).length === 0 && (
          <div className="text-center text-muted">
            No skills added yet. Click "Add Skill" to add a skill.
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default CreatureSkillsForm; 
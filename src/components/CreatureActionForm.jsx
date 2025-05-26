import React, { useState } from 'react';
import { Card, Row, Col, Form, Button } from 'react-bootstrap';
import { Trash, Plus, Upload } from 'react-bootstrap-icons';

function CreatureActionForm({ actions = [], onChange, onAddAction, onRemoveAction }) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleActionChange = (index, field, value) => {
    const updatedActions = [...actions];
    updatedActions[index] = {
      ...updatedActions[index],
      [field]: value
    };
    onChange(updatedActions);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const importedActions = data.items
          .filter(item => item.type === 'action')
          .map(action => ({
            name: action.name,
            actionType: action.system.actionType.value,
            actions: action.system.actions.value?.toString() || null,
            description: action.system.description.value,
            traits: action.system.traits.value || [],
            category: action.system.category || 'offensive'
          }));

        if (importedActions.length > 0) {
          onChange([...actions, ...importedActions]);
          setImportDialogOpen(false);
          setSelectedFile(null);
        }
      } catch (error) {
        console.error('Error importing actions:', error);
        alert('Error importing actions. Please make sure the file is a valid bestiary JSON file.');
      }
    };
    reader.readAsText(selectedFile);
  };

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Actions</h5>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm" onClick={() => setImportDialogOpen(true)}>
            <Upload /> Import from Bestiary
          </Button>
          <Button variant="outline-primary" size="sm" onClick={() => onAddAction('action')}>
            <Plus /> Add Action
          </Button>
          <Button variant="outline-primary" size="sm" onClick={() => onAddAction('reaction')}>
            <Plus /> Add Reaction
          </Button>
          <Button variant="outline-primary" size="sm" onClick={() => onAddAction('passive')}>
            <Plus /> Add Passive
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {actions.map((action, index) => (
          <Card key={index} className="mb-3">
            <Card.Body>
              <Row className="mb-2">
                <Col>
                  <Form.Group>
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={action.name || ''}
                      onChange={e => handleActionChange(index, 'name', e.target.value)}
                      placeholder="Enter action name"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Type</Form.Label>
                    <Form.Select
                      value={action.actionType || 'action'}
                      onChange={e => handleActionChange(index, 'actionType', e.target.value)}
                    >
                      <option value="action">Action</option>
                      <option value="reaction">Reaction</option>
                      <option value="passive">Passive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                {action.actionType === 'action' && (
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Actions</Form.Label>
                      <Form.Select
                        value={action.actions || '1'}
                        onChange={e => handleActionChange(index, 'actions', e.target.value)}
                      >
                        <option value="1">1 Action</option>
                        <option value="2">2 Actions</option>
                        <option value="3">3 Actions</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                )}
                <Col md="auto" className="d-flex align-items-end">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onRemoveAction(index)}
                  >
                    <Trash />
                  </Button>
                </Col>
              </Row>
              <Form.Group>
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={action.description || ''}
                  onChange={e => handleActionChange(index, 'description', e.target.value)}
                  placeholder="Enter action description"
                />
              </Form.Group>
              {action.traits && action.traits.length > 0 && (
                <div className="mt-2">
                  <small className="text-muted">
                    Traits: {action.traits.join(', ')}
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        ))}
      </Card.Body>

      {/* Import Dialog */}
      {importDialogOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Import Actions from Bestiary</h5>
                <Button
                  variant="close"
                  onClick={() => {
                    setImportDialogOpen(false);
                    setSelectedFile(null);
                  }}
                />
              </div>
              <div className="modal-body">
                <Form.Group>
                  <Form.Label>Select Bestiary JSON File</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                  />
                </Form.Group>
              </div>
              <div className="modal-footer">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setImportDialogOpen(false);
                    setSelectedFile(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImport}
                  disabled={!selectedFile}
                >
                  Import
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default CreatureActionForm; 
import React, { useState, useEffect } from 'react';
import { Container, Form, Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { loadSpellsIntoDB, searchSpells, isDatabasePopulated, clearDatabase } from '../services/spellDB';
import SpellDetailModal from './SpellDetailModal';

function SpellsTab({ onAddSpell }) {
  const [spells, setSpells] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear the database first
      await clearDatabase();
      
      // Then reload the spells
      const success = await loadSpellsIntoDB();
      if (!success) {
        throw new Error('Failed to load spells into database');
      }
      
      const initialSpells = await searchSpells('');
      if (!initialSpells || initialSpells.length === 0) {
        throw new Error('No spells found in database');
      }
      
      setSpells(initialSpells);
    } catch (err) {
      console.error('Error reloading spells:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeDB = async () => {
      try {
        setLoading(true);
        setError(null);
        const isPopulated = await isDatabasePopulated();
        console.log('Is database populated?', isPopulated);
        
        if (!isPopulated) {
          console.log('Database not populated, loading spells...');
          const success = await loadSpellsIntoDB();
          console.log('Load spells result:', success);
          if (!success) {
            throw new Error('Failed to load spells into database');
          }
        }
        
        const initialSpells = await searchSpells('');
        console.log('Initial spells loaded:', initialSpells?.length);
        if (!initialSpells || initialSpells.length === 0) {
          throw new Error('No spells found in database');
        }
        
        setSpells(initialSpells);
      } catch (err) {
        console.error('Error initializing spells:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeDB();
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Searching for:', { searchTerm, levelFilter });
        const results = await searchSpells(searchTerm, levelFilter);
        console.log('Search results:', results?.length);
        setSpells(results);
      } catch (err) {
        console.error('Error searching spells:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [searchTerm, levelFilter]);

  const handleSpellClick = (spell) => {
    setSelectedSpell(spell);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSpell(null);
  };

  if (error) {
    return (
      <Container fluid>
        <Alert variant="danger" className="mt-3">
          <Alert.Heading>Error Loading Spells</Alert.Heading>
          <p>{error}</p>
          <Button variant="primary" onClick={handleRetry}>
            Clear Database and Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Search spells..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col md={4}>
          <Form.Control
            as="select"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="">All Levels</option>
            {[...Array(11)].map((_, i) => (
              <option key={i} value={i}>Level {i}</option>
            ))}
          </Form.Control>
        </Col>
        <Col md={2}>
          <Button variant="outline-secondary" onClick={handleRetry} size="sm" className="w-100">
            Clear DB & Retry
          </Button>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading spells...</span>
          </Spinner>
        </div>
      ) : spells.length === 0 ? (
        <Alert variant="info">
          No spells found. Try adjusting your search criteria.
        </Alert>
      ) : (
        <Row>
          {spells.map((spell) => (
            <Col key={spell.id} md={4} className="mb-3">
              <Card
                onClick={() => handleSpellClick(spell)}
                style={{ cursor: 'pointer' }}
                className="h-100"
              >
                <Card.Body>
                  <Card.Title>{spell.name}</Card.Title>
                  {spell.oldName && (
                    <Card.Subtitle className="mb-1 text-muted">
                      <small>Previously: {spell.oldName}</small>
                    </Card.Subtitle>
                  )}
                  <Card.Subtitle className="mb-2 text-muted">
                    Level {spell.level}
                  </Card.Subtitle>
                  {spell.traits && spell.traits.length > 0 && (
                    <div className="mb-2">
                      {spell.traits.map((trait, index) => (
                        <span key={index} className="badge bg-secondary me-1">
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <SpellDetailModal
        spell={selectedSpell}
        show={showModal}
        onHide={handleCloseModal}
        onAddSpell={onAddSpell}
      />
    </Container>
  );
}

export default SpellsTab; 
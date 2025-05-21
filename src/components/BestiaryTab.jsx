import React, { useState, useEffect } from 'react';
import { Container, Form, Row, Col, Card, Spinner } from 'react-bootstrap';
import { loadMonstersIntoDB, searchMonsters, isDatabasePopulated } from '../services/monsterDB';
import MonsterDetailModal from './MonsterDetailModal';

function BestiaryTab({ onAddCreature }) {
  const [monsters, setMonsters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Initialize database on first load
  useEffect(() => {
    async function initializeDB() {
      try {
        setLoading(true);
        const isPopulated = await isDatabasePopulated();
        if (!isPopulated) {
          await loadMonstersIntoDB();
        }
        // Initial search with empty filters
        const initialMonsters = await searchMonsters({});
        setMonsters(initialMonsters);
      } catch (error) {
        console.error('Error initializing database:', error);
      } finally {
        setLoading(false);
      }
    }

    initializeDB();
  }, []);

  // Handle search and filter changes
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      try {
        setLoading(true);
        const results = await searchMonsters({
          nameSearch: searchTerm,
          levelFilter: levelFilter
        });
        setMonsters(results);
      } catch (error) {
        console.error('Error searching monsters:', error);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce search for better performance

    return () => clearTimeout(searchTimer);
  }, [searchTerm, levelFilter]);

  const handleMonsterClick = (monster) => {
    setSelectedMonster(monster);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMonster(null);
  };

  const handleImportToCreatures = (creature) => {
    if (onAddCreature) {
      onAddCreature(creature);
    }
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col md={8}>
          <Form.Group>
            <Form.Label>Search by name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter monster name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Filter by level</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter level..."
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Results count */}
      <Row className="mb-3">
        <Col>
          <p className="text-muted">
            Found {monsters.length} {monsters.length === 1 ? 'monster' : 'monsters'}
          </p>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center my-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <Row>
          {monsters.map(monster => (
            <Col key={monster.id} xs={12} md={6} lg={4} className="mb-3">
              <Card 
                onClick={() => handleMonsterClick(monster)}
                style={{ cursor: 'pointer' }}
                className="h-100 hover-shadow"
              >
                <Card.Body>
                  <Card.Title>{monster.name}</Card.Title>
                  <Card.Text>
                    Level {monster.level}
                    <br />
                    HP: {monster.system.attributes.hp.max}
                    <br />
                    AC: {monster.system.attributes.ac.value}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <MonsterDetailModal
        show={showModal}
        onHide={handleCloseModal}
        monster={selectedMonster}
        onImportToCreatures={handleImportToCreatures}
      />

      <style>
        {`
          .hover-shadow:hover {
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
            transform: translateY(-2px);
            transition: all 0.2s ease-in-out;
          }
        `}
      </style>
    </Container>
  );
}

export default BestiaryTab; 
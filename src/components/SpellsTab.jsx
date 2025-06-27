import React, { useState, useEffect } from 'react';
import { Container, Form, Row, Col, Card, Spinner, Alert, Button, Pagination } from 'react-bootstrap';
import SpellDetailModal from './SpellDetailModal';
import { searchSpells, clearSpellDB, loadSpellsIntoDB } from '../services/spellDB';
import { ArrowClockwise } from 'react-bootstrap-icons';

function SpellsTab({ onAddSpell, savedCreatures }) {
  const [spells, setSpells] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredSpells, setFilteredSpells] = useState([]);
  const [allLevels, setAllLevels] = useState([]);
  const spellsPerPage = 20;

  // Load initial data and get all unique levels
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const allSpells = await searchSpells('');
        const levels = Array.from(new Set(allSpells.map(s => s.level))).sort((a, b) => a - b);
        setAllLevels(levels);
        setFilteredSpells(allSpells);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Failed to load spells');
      }
    };
    loadInitialData();
  }, []);

  // Filtering logic (applied on every filter change) - filters over all spells
  useEffect(() => {
    const loadSpells = async () => {
      setLoading(true);
      try {
        // Get full spell data from database
        const allSpells = await searchSpells('');
        let filtered = allSpells;
        
        if (searchTerm) {
          const searchTermLower = searchTerm.toLowerCase();
          filtered = filtered.filter(s => 
            s.name.toLowerCase().includes(searchTermLower) || 
            (s.oldName && s.oldName.toLowerCase().includes(searchTermLower))
          );
        }
        if (levelFilter !== '') {
          filtered = filtered.filter(s => s.level === Number(levelFilter));
        }
        setFilteredSpells(filtered);
        setCurrentPage(1); // Reset to page 1 on filter change
      } catch (error) {
        console.error('Error loading spells:', error);
        setError('Failed to load spells');
      } finally {
        setLoading(false);
      }
    };

    loadSpells();
  }, [searchTerm, levelFilter]);

  // Pagination logic - slice the filtered spells for the current page
  useEffect(() => {
    const startIndex = (currentPage - 1) * spellsPerPage;
    const endIndex = startIndex + spellsPerPage;
    setSpells(filteredSpells.slice(startIndex, endIndex));
  }, [filteredSpells, currentPage]);

  // Load full spell data on card click
  const handleSpellClick = async (spell) => {
    //console.log('Clicked spell:', spell);
    setShowModal(true);
    setModalLoading(true);
    setSelectedSpell(null);
    setError(null);
    try {
      const results = await searchSpells(spell.name);
      //console.log('Search results:', results);
      if (results.length === 0) throw new Error('Spell not found in database');
      setSelectedSpell(results[0]);
    } catch (err) {
      setError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSpell(null);
  };

  // Pagination component
  const renderPagination = () => {
    if (filteredSpells.length <= spellsPerPage) return null;

    const totalPages = Math.ceil(filteredSpells.length / spellsPerPage);
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="justify-content-center mt-3">
        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
        <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} />
        {startPage > 1 && <Pagination.Ellipsis />}
        {pages}
        {endPage < totalPages && <Pagination.Ellipsis />}
        <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} />
        <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
      </Pagination>
    );
  };

  const handleReloadDatabase = async () => {
    setLoading(true);
    try {
      await clearSpellDB();
      await loadSpellsIntoDB();
      const allSpells = await searchSpells('');
      const levels = Array.from(new Set(allSpells.map(s => s.level))).sort((a, b) => a - b);
      setAllLevels(levels);
      setFilteredSpells(allSpells);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error reloading spell database:', error);
      setError('Failed to reload spell database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col md={7}>
          <Form.Control
            type="text"
            placeholder="Search spells..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col md={3}>
          <Form.Select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="">All Levels</option>
            {allLevels.map(level => (
              <option key={level} value={level}>Level {level}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Button 
            variant="outline-secondary" 
            onClick={handleReloadDatabase}
            disabled={loading}
            className="w-100"
          >
            <ArrowClockwise /> Reload DB
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
          {spells.map((spell) => {
            //console.log('Spell data:', spell);
            return (
              <Col key={spell.slug} md={4} className="mb-3">
                <Card
                  onClick={() => handleSpellClick(spell)}
                  style={{ cursor: 'pointer' }}
                  className="h-100"
                >
                  <Card.Body>
                    <Card.Title>
                      {spell.name}
                      {spell.oldName && (
                        <div>
                          <small className="text-muted fst-italic" style={{ fontSize: '13px' }}>
                            Previously: {spell.oldName}
                          </small>
                        </div>
                      )}
                    </Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      level {spell.level}
                    </Card.Subtitle>
                    {spell.traits && spell.traits.length > 0 && (
                      <div className="mb-2">
                        {spell.traits.map((trait, index) => (
                          <span key={`${spell.slug}-trait-${index}`} className="badge bg-secondary me-1">
                            {trait}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {renderPagination()}

      <SpellDetailModal
        spell={selectedSpell}
        show={showModal}
        onHide={handleCloseModal}
        onAddSpell={onAddSpell}
        loading={modalLoading}
        error={error && showModal ? error : null}
        savedCreatures={savedCreatures}
      />
    </Container>
  );
}

export default SpellsTab; 
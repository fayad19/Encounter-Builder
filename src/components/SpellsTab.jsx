import React, { useState, useEffect } from 'react';
import { Container, Form, Row, Col, Card, Spinner, Alert, Button, Pagination } from 'react-bootstrap';
import SpellDetailModal from './SpellDetailModal';
import spellSummary from '../data/spell-summary.json';
import { searchSpells } from '../services/spellDB';

function SpellsTab({ onAddSpell }) {
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
  const spellsPerPage = 20;

  // Get all unique levels for filter dropdown
  const allLevels = Array.from(new Set(spellSummary.map(s => s.level))).sort((a, b) => a - b);

  // Filtering logic (applied on every filter change) - filters over all spells
  useEffect(() => {
    setLoading(true);
    let filtered = spellSummary;
    if (searchTerm) {
      filtered = filtered.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (levelFilter !== '') {
      filtered = filtered.filter(s => s.level === Number(levelFilter));
    }
    setFilteredSpells(filtered);
    setCurrentPage(1); // Reset to page 1 on filter change
    setLoading(false);
  }, [searchTerm, levelFilter]);

  // Pagination logic - slice the filtered spells for the current page
  useEffect(() => {
    const startIndex = (currentPage - 1) * spellsPerPage;
    const endIndex = startIndex + spellsPerPage;
    setSpells(filteredSpells.slice(startIndex, endIndex));
  }, [filteredSpells, currentPage]);

  // Load full spell data on card click
  const handleSpellClick = async (spell) => {
    setShowModal(true);
    setModalLoading(true);
    setSelectedSpell(null);
    setError(null);
    try {
      const results = await searchSpells(spell.name);
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
    setModalLoading(false);
    setError(null);
  };

  // Compute total pages for pagination
  const totalPages = Math.ceil(filteredSpells.length / spellsPerPage);

  // Render responsive, ellipsed pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const items = [];
    const showLeftEllipsis = currentPage > 3;
    const showRightEllipsis = currentPage < totalPages - 2;

    // Always show first page
    items.push(
      <Pagination.Item key={1} active={1 === currentPage} onClick={() => setCurrentPage(1)}>
        1
      </Pagination.Item>
    );

    // Show left ellipsis if needed
    if (showLeftEllipsis) {
      items.push(<Pagination.Ellipsis key="left-ellipsis" disabled />);
    }

    // Show pages around current page
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    if (!showLeftEllipsis) {
      startPage = 2;
    }
    if (!showRightEllipsis) {
      endPage = totalPages - 1;
    }
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item key={i} active={i === currentPage} onClick={() => setCurrentPage(i)}>
          {i}
        </Pagination.Item>
      );
    }

    // Show right ellipsis if needed
    if (showRightEllipsis) {
      items.push(<Pagination.Ellipsis key="right-ellipsis" disabled />);
    }

    // Always show last page if more than 1
    if (totalPages > 1) {
      items.push(
        <Pagination.Item key={totalPages} active={totalPages === currentPage} onClick={() => setCurrentPage(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    return (
      <div className="d-flex justify-content-center mt-3">
        <div style={{ minWidth: '300px', maxWidth: '100%', overflowX: 'auto' }}>
          <Pagination className="justify-content-center mb-0">
            {currentPage > 1 && <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} />}
            {items}
            {currentPage < totalPages && <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} />}
          </Pagination>
        </div>
      </div>
    );
  };

  return (
    <Container fluid>
      {error && !showModal && (
        <Alert variant="danger" className="mt-3">
          <Alert.Heading>Error Loading Spells</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}
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
            {allLevels.map((lvl) => (
              <option key={lvl} value={lvl}>Level {lvl}</option>
            ))}
          </Form.Control>
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
            <Col key={spell.slug} md={4} className="mb-3">
              <Card
                onClick={() => handleSpellClick(spell)}
                style={{ cursor: 'pointer' }}
                className="h-100"
              >
                <Card.Body>
                  <Card.Title>{spell.name}</Card.Title>
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

      {renderPagination()}

      <SpellDetailModal
        spell={selectedSpell}
        show={showModal}
        onHide={handleCloseModal}
        onAddSpell={onAddSpell}
        loading={modalLoading}
        error={error && showModal ? error : null}
      />
    </Container>
  );
}

export default SpellsTab; 
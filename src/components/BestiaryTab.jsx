import React, { useState, useEffect } from 'react';
import { Container, Form, Row, Col, Card, Spinner, Alert, Button, Pagination } from 'react-bootstrap';
import MonsterDetailModal from './MonsterDetailModal';
import monsterSummary from '../data/monster-summary.json';
import { searchMonsters } from '../services/monsterDB';
import { Plus } from 'react-bootstrap-icons';
import { extractResistancesFromRules } from '../utils/creatureConversion';

function BestiaryTab({ onAddCreature }) {
  const [monsters, setMonsters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredMonsters, setFilteredMonsters] = useState([]);
  const monstersPerPage = 20;

  // Get all unique types and rarities for filter dropdowns
  const allTypes = Array.from(new Set(monsterSummary.flatMap(m => m.type))).sort();
  const allRarities = Array.from(new Set(monsterSummary.map(m => m.rarity).filter(Boolean))).sort();

  // Filtering logic (applied on every filter change) - filters over all monsters
  useEffect(() => {
    setLoading(true);
    let filtered = monsterSummary;
    if (searchTerm) {
      filtered = filtered.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (levelFilter !== '') {
      filtered = filtered.filter(m => m.level === Number(levelFilter));
    }
    if (typeFilter) {
      filtered = filtered.filter(m => m.type.includes(typeFilter));
    }
    if (rarityFilter) {
      filtered = filtered.filter(m => m.rarity === rarityFilter);
    }
    setFilteredMonsters(filtered);
    setCurrentPage(1); // Reset to page 1 on filter change
    setLoading(false);
  }, [searchTerm, levelFilter, typeFilter, rarityFilter]);

  // Pagination logic - slice the filtered monsters for the current page
  useEffect(() => {
    const startIndex = (currentPage - 1) * monstersPerPage;
    const endIndex = startIndex + monstersPerPage;
    setMonsters(filteredMonsters.slice(startIndex, endIndex));
  }, [filteredMonsters, currentPage]);

  // Load full monster data on card click
  const handleMonsterClick = async (monster) => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchMonsters({ nameSearch: monster.name });
      if (results.length === 0) throw new Error('Monster not found in database');
      setSelectedMonster(results[0]);
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  // Compute total pages for pagination
  const totalPages = Math.ceil(filteredMonsters.length / monstersPerPage);

  // Render responsive, ellipsed pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const items = [];
    const maxPageButtons = 5; // Number of page buttons to show around current page
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
      {error && (
        <Alert variant="danger" className="mb-3">
          <Alert.Heading>Error Loading Monster</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}
      <Row className="mb-4">
        <Col md={4}>
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
        <Col md={2}>
          <Form.Group>
            <Form.Label>Level</Form.Label>
            <Form.Control
              type="number"
              placeholder="Level"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Type</Form.Label>
            <Form.Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All</option>
              {allTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Rarity</Form.Label>
            <Form.Select value={rarityFilter} onChange={e => setRarityFilter(e.target.value)}>
              <option value="">All</option>
              {allRarities.map(rarity => (
                <option key={rarity} value={rarity}>{rarity}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col>
          <p className="text-muted">
            Found {filteredMonsters.length} {filteredMonsters.length === 1 ? 'monster' : 'monsters'} (showing page {currentPage} of {totalPages})
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
            <Col key={monster.filename} xs={12} md={6} lg={4} className="mb-3">
              <Card 
                onClick={() => handleMonsterClick(monster)}
                style={{ cursor: 'pointer', position: 'relative' }}
                className="h-100 hover-shadow"
              >
                <Button
                  variant="outline-success"
                  size="sm"
                  style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
                  title="Import to Creatures"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const results = await searchMonsters({ nameSearch: monster.name });
                      if (results.length === 0) throw new Error('Monster not found in database');
                      const monsterData = results[0];
                      const attrResistances = monsterData.system.attributes.resistances?.map(res => ({
                        type: res.type,
                        value: res.value || '',
                        exceptions: res.exceptions || []
                      })) || [];
                      const ruleResistances = extractResistancesFromRules(monsterData).map(res => ({
                        type: res.type,
                        value: res.value || '',
                        exceptions: res.exceptions || []
                      }));
                      const resistanceKey = r => `${r.type}-${r.value}-${(r.exceptions||[]).join(',')}`;
                      const allResistancesMap = new Map();
                      attrResistances.concat(ruleResistances).forEach(r => {
                        allResistancesMap.set(resistanceKey(r), r);
                      });
                      const allResistances = Array.from(allResistancesMap.values());

                      // Calculate spell DC and attack modifier
                      const mentalScores = {
                        int: monsterData.system.abilities.int.mod,
                        wis: monsterData.system.abilities.wis.mod,
                        cha: monsterData.system.abilities.cha.mod
                      };
                      const highestMental = Math.max(...Object.values(mentalScores));
                      const spellDC = 10 + monsterData.level + highestMental;
                      const spellAttackMod = monsterData.level + highestMental;

                      const creature = {
                        id: Date.now(),
                        name: monsterData.name,
                        hp: monsterData.system.attributes.hp.max,
                        maxHp: monsterData.system.attributes.hp.max,
                        ac: monsterData.system.attributes.ac.value,
                        perception: monsterData.system.perception.value,
                        fortitude: monsterData.system.saves.fortitude.value,
                        reflex: monsterData.system.saves.reflex.value,
                        will: monsterData.system.saves.will.value,
                        level: monsterData.level,
                        dc: spellDC,
                        spellAttackMod: spellAttackMod,
                        attacks: [],
                        actions: [],
                        resistances: allResistances,
                        immunities: monsterData.system.attributes.immunities?.map(imm => ({
                          type: imm.type,
                          exceptions: imm.exceptions || []
                        })) || [],
                        weaknesses: monsterData.system.attributes.weaknesses?.map(weak => ({
                          type: weak.type,
                          value: weak.value || '',
                          exceptions: weak.exceptions || []
                        })) || [],
                        items: monsterData.items
                      };
                      if (monsterData.items) {
                        monsterData.items.forEach(item => {
                          if (item.type === 'melee' || item.type === 'ranged') {
                            creature.attacks.push({
                              attackName: item.name,
                              attackType: item.type,
                              attackCategory: item.type,
                              firstHitModifier: item.system.bonus?.value || 0,
                              secondHitModifier: item.system.bonus?.value ? item.system.bonus.value - 5 : -5,
                              thirdHitModifier: item.system.bonus?.value ? item.system.bonus.value - 10 : -10,
                              damage: Object.values(item.system.damageRolls || {})
                                .map(roll => `${roll.damage} ${roll.damageType}`)
                                .join(' plus ')
                            });
                          } else if (item.type === 'spell') {
                            const hasDirectDamage = item.system.damage && Object.keys(item.system.damage).length > 0;
                            const spellType = hasDirectDamage ? 'spell' : 'regularSpell';
                            const spellAttack = {
                              attackName: item.name,
                              attackType: spellType,
                              attackCategory: spellType,
                              actions: item.system.time?.value || '2',
                              range: item.system.range?.value || '',
                              description: item.system.description?.value || '',
                              targetOrArea: item.system.area ? 'area' : 'target',
                              slug: item.system.slug || ''
                            };
                            if (item.system.area) {
                              spellAttack.area = `${item.system.area.value}-foot ${item.system.area.type}`;
                              spellAttack.areaType = item.system.area.type;
                            }
                            if (item.system.defense?.save) {
                              spellAttack.save = item.system.defense.save.statistic;
                              if (item.system.defense.save.basic) {
                                spellAttack.save += ' (basic)';
                              }
                            }
                            if (hasDirectDamage) {
                              const damageFormulas = Object.values(item.system.damage)
                                .map(damage => `${damage.formula} ${damage.type}`)
                                .join(' plus ');
                              spellAttack.damage = damageFormulas;
                            }
                            if (item.system.duration?.value) {
                              spellAttack.duration = item.system.duration.value;
                            }
                            if (item.system.target?.value) {
                              spellAttack.targets = item.system.target.value;
                            }
                            creature.attacks.push(spellAttack);
                          } else if (item.type === 'action') {
                            creature.actions.push({
                              name: item.name,
                              actionType: item.system.actionType.value,
                              actions: item.system.actions.value?.toString() || null,
                              description: item.system.description.value,
                              traits: item.system.traits.value || [],
                              category: item.system.category || 'offensive'
                            });
                          }
                        });
                      }
                      handleImportToCreatures(creature);
                    } catch (err) {
                      alert('Error importing monster: ' + err.message);
                    }
                  }}
                >
                  <Plus />
                </Button>
                <Card.Body>
                  <Card.Title>{monster.name}</Card.Title>
                  <Card.Text>
                    Level: {monster.level} <br />
                    Rarity: {monster.rarity} <br />
                    Type: {monster.type.join(', ')}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      {renderPagination()}
      <MonsterDetailModal
        monster={selectedMonster}
        show={showModal}
        onHide={handleCloseModal}
        onImportToCreatures={handleImportToCreatures}
      />
    </Container>
  );
}

export default BestiaryTab; 
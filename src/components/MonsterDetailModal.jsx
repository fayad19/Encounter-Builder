import React, { useState } from 'react';
import { Modal, Table, Button } from 'react-bootstrap';
import { getSpellBySlug, SPELL_NAME_MAPPING } from '../services/spellDB';
import SharedSpellModal from './SharedSpellModal';

function MonsterDetailModal({ monster, show, onHide, onImportToCreatures }) {
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [showSpellModal, setShowSpellModal] = useState(false);

  if (!monster) return null;

  // Helper function to clean up spell descriptions and handle UUID references
  const processDescription = (description) => {
    if (!description) return '';
    
    // Remove HTML tags
    let processed = description.replace(/<\/?[^>]+(>|$)/g, '');
    
    // Convert UUID references to clickable text
    processed = processed.replace(/@UUID\[Compendium\.pf2e\.([^.]+)\.Item\.([^\]]+)\]{([^}]+)}/g, 
      (match, type, id, text) => {
        return `<a href="#" class="spell-reference" data-type="${type}" data-id="${id}">${text}</a>`;
      }
    );
    
    return processed;
  };

  const handleSpellReferenceClick = async (event) => {
    if (event.target.classList.contains('spell-reference')) {
      event.preventDefault();
      const type = event.target.getAttribute('data-type');
      const id = event.target.getAttribute('data-id');
      
      if (type === 'spells-srd') {
        const spell = await getSpellBySlug(id);
        if (spell) {
          setSelectedSpell(spell);
          setShowSpellModal(true);
        }
      }
    }
  };

  const convertMonsterToCreature = () => {
    // Convert monster data to creature format
    const creature = {
      id: Date.now(), // Generate a new ID
      name: monster.name,
      hp: monster.system.attributes.hp.max,
      maxHp: monster.system.attributes.hp.max,
      ac: monster.system.attributes.ac.value,
      perception: monster.system.perception.value,
      fortitude: monster.system.saves.fortitude.value,
      reflex: monster.system.saves.reflex.value,
      will: monster.system.saves.will.value,
      level: monster.level,
      dc: monster.system.attributes.spellDC?.value || null,
      attacks: []
    };

    // Convert monster items (abilities and attacks) to creature attacks
    if (monster.items) {
      monster.items.forEach(item => {
        if (item.type === 'melee' || item.type === 'ranged') {
          // Handle physical attacks
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
          // Determine if it's an attack spell or regular spell based on damage property
          const hasDirectDamage = item.system.damage && Object.keys(item.system.damage).length > 0;
          const spellType = hasDirectDamage ? 'spell' : 'regularSpell';
          
          // Helper function to get the correct spell name based on remaster status
          const getSpellName = (item) => {
            // If this is a remastered monster, use the current name
            if (item.system.publication?.remaster) {
              return item.name;
            }
            
            // For non-remastered content, check if there's a remastered equivalent
            return SPELL_NAME_MAPPING[item.name] || item.name;
          };

          const spellAttack = {
            attackName: getSpellName(item),
            attackType: spellType,
            attackCategory: spellType,
            actions: item.system.time?.value || '2',
            range: item.system.range?.value || '',
            description: processDescription(item.system.description?.value),
            // Set targetOrArea based on whether the spell has an area
            targetOrArea: item.system.area ? 'area' : 'target',
            // Add slug for spell identification
            slug: item.system.slug || ''
          };

          // Add area information if present
          if (item.system.area) {
            spellAttack.area = `${item.system.area.value}-foot ${item.system.area.type}`;
            spellAttack.areaType = item.system.area.type;
          }

          // Add save information if present
          if (item.system.defense?.save) {
            spellAttack.save = item.system.defense.save.statistic;
            if (item.system.defense.save.basic) {
              spellAttack.save += ' (basic)';
            }
          }

          // Add damage information for attack spells
          if (hasDirectDamage) {
            const damageFormulas = Object.values(item.system.damage)
              .map(damage => `${damage.formula} ${damage.type}`)
              .join(' plus ');
            spellAttack.damage = damageFormulas;
          }

          // Add duration if present
          if (item.system.duration?.value) {
            spellAttack.duration = item.system.duration.value;
          }

          // Add targets if present
          if (item.system.target?.value) {
            spellAttack.targets = item.system.target.value;
          }

          creature.attacks.push(spellAttack);
        }
      });
    }

    return creature;
  };

  const handleImport = () => {
    const creature = convertMonsterToCreature();
    if (onImportToCreatures) {
      onImportToCreatures(creature);
      onHide();
    }
  };

  const renderAbilities = () => {
    if (!monster.items) return null;
    return monster.items.map((item, index) => (
      <div key={index} className="mb-3">
        <h6>{item.name}</h6>
        <div dangerouslySetInnerHTML={{ __html: item.system?.description?.value || '' }} />
      </div>
    ));
  };

  const renderAttributes = () => {
    const { attributes } = monster.system;
    return (
      <Table striped bordered>
        <tbody>
          <tr>
            <td>HP</td>
            <td>{attributes.hp.max} {attributes.hp.details && `(${attributes.hp.details})`}</td>
          </tr>
          <tr>
            <td>AC</td>
            <td>{attributes.ac.value} {attributes.ac.details && `(${attributes.ac.details})`}</td>
          </tr>
          {attributes.speed && (
            <tr>
              <td>Speed</td>
              <td>
                {attributes.speed.value} feet
                {attributes.speed.otherSpeeds?.map((speed, i) => (
                  <div key={i}>{speed.type}: {speed.value} feet</div>
                ))}
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    );
  };

  const renderAbilityScores = () => {
    const abilities = monster.system.abilities;
    return (
      <Table striped bordered>
        <thead>
          <tr>
            <th>STR</th>
            <th>DEX</th>
            <th>CON</th>
            <th>INT</th>
            <th>WIS</th>
            <th>CHA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(ability => (
              <td key={ability}>
                {abilities[ability].mod >= 0 ? '+' : ''}{abilities[ability].mod}
              </td>
            ))}
          </tr>
        </tbody>
      </Table>
    );
  };

  const renderSenses = () => {
    const { senses } = monster.system.perception;
    if (!senses || senses.length === 0) return null;
    
    return (
      <div className="mb-3">
        <h6>Senses</h6>
        <ul className="list-unstyled">
          {senses.map((sense, index) => (
            <li key={index}>
              {sense.type}
              {sense.value && ` ${sense.value}`}
              {sense.details && ` (${sense.details})`}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderLanguages = () => {
    const languages = monster.system.details.languages?.value;
    if (!languages || languages.length === 0) return null;

    return (
      <div className="mb-3">
        <h6>Languages</h6>
        <p>{languages.join(', ')}</p>
      </div>
    );
  };

  const extractResistancesFromRules = (monster) => {
    if (!monster.items) return [];
    
    const resistances = new Map(); // Use Map to avoid duplicates
    const currentHpPercent = (monster.system.attributes.hp.value / monster.system.attributes.hp.max) * 100;
    
    monster.items.forEach(item => {
      if (item.system?.rules) {
        item.system.rules.forEach(rule => {
          if (rule.key === 'Resistance') {
            // Check if the resistance applies based on HP predicate
            const hpPredicate = rule.predicate?.find(p => p.lt || p.gte);
            if (hpPredicate) {
              const threshold = hpPredicate.lt ? hpPredicate.lt[1] : hpPredicate.gte[1];
              const isAbove = hpPredicate.gte !== undefined;
              const isBelow = hpPredicate.lt !== undefined;
              
              // Only include if the HP condition is met
              if ((isAbove && currentHpPercent >= threshold) || 
                  (isBelow && currentHpPercent < threshold)) {
                const key = `${rule.type}-${rule.value}`;
                resistances.set(key, {
                  type: rule.type,
                  value: rule.value,
                  exceptions: rule.exceptions || [],
                  predicate: rule.predicate
                });
              }
            } else {
              // If no HP predicate, always include
              const key = `${rule.type}-${rule.value}`;
              resistances.set(key, {
                type: rule.type,
                value: rule.value,
                exceptions: rule.exceptions || [],
                predicate: rule.predicate
              });
            }
          }
        });
      }
    });
    
    return Array.from(resistances.values());
  };

  const formatResistanceText = (res) => {
    let text = `${res.type} ${res.value}`;
    if (res.exceptions && res.exceptions.length > 0) {
      text += ` (except ${res.exceptions.join(', ')})`;
    }
    return text;
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {monster.name} <small className="text-muted">Level {monster.level}</small>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body onClick={handleSpellReferenceClick}>
          {/* Description */}
          {monster.system.details.publicNotes && (
            <div className="mb-4">
              <div 
                className="mb-4"
                dangerouslySetInnerHTML={{ 
                  __html: processDescription(monster.system.details.publicNotes)
                }} 
              />
            </div>
          )}

          {/* Core Stats */}
          <h5>Core Statistics</h5>
          {renderAttributes()}

          {/* Resistances, Immunities, Weaknesses, Conditional Effects */}
          {(monster.system?.attributes?.resistances?.length > 0 || extractResistancesFromRules(monster).length > 0) && (
            <div className="mb-3">
              <h6>Resistances</h6>
              <ul className="list-unstyled">
                {monster.system?.attributes?.resistances?.map((res, i) => (
                  <li key={`attr-${i}`}>
                    {typeof res === 'string' ? res : 
                      `${res.type}${res.value ? ` ${res.value}` : ''}${res.details ? ` (${res.details})` : ''}${res.exceptions ? ` (except ${res.exceptions.join(', ')})` : ''}`
                    }
                  </li>
                ))}
                {extractResistancesFromRules(monster).map((res, i) => (
                  <li key={`rule-${i}`}>{formatResistanceText(res)}</li>
                ))}
              </ul>
            </div>
          )}
          {monster.system?.attributes?.immunities?.length > 0 && (
            <div className="mb-3">
              <h6>Immunities</h6>
              <ul className="list-unstyled">
                {monster.system.attributes.immunities.map((imm, i) => (
                  <li key={i}>
                    {typeof imm === 'string' ? imm : 
                      `${imm.type}${imm.value ? ` ${imm.value}` : ''}${imm.details ? ` (${imm.details})` : ''}${imm.exceptions ? ` (except ${imm.exceptions})` : ''}`
                    }
                  </li>
                ))}
              </ul>
            </div>
          )}
          {monster.system?.attributes?.weaknesses?.length > 0 && (
            <div className="mb-3">
              <h6>Weaknesses</h6>
              <ul className="list-unstyled">
                {monster.system.attributes.weaknesses.map((weak, i) => (
                  <li key={i}>
                    {typeof weak === 'string' ? weak : 
                      `${weak.type}${weak.value ? ` ${weak.value}` : ''}${weak.details ? ` (${weak.details})` : ''}${weak.exceptions ? ` (except ${weak.exceptions})` : ''}`
                    }
                  </li>
                ))}
              </ul>
            </div>
          )}
          {monster.system?.attributes?.conditionalEffects?.length > 0 && (
            <div className="mb-3">
              <h6>Conditional Effects</h6>
              <ul className="list-unstyled">
                {monster.system.attributes.conditionalEffects.map((cond, i) => (
                  <li key={i}>
                    {cond.type ? <b>{cond.type}</b> : null}
                    {cond.value !== undefined ? ` ${cond.value}` : ''}
                    {cond.conditions && cond.conditions.predicate ? (
                      <span> (Condition: {Object.entries(cond.conditions.predicate).map(([op, arr]) => `${arr[0]} ${op} ${arr[1]}`).join(', ')})</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ability Scores */}
          <h5>Ability Scores</h5>
          {renderAbilityScores()}

          {/* Senses and Languages */}
          {renderSenses()}
          {renderLanguages()}

          {/* Abilities and Actions */}
          <h5>Abilities and Actions</h5>
          {renderAbilities()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleImport}>
            Import to Creatures
          </Button>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      
      <SharedSpellModal
        spell={selectedSpell}
        show={showSpellModal}
        onHide={() => {
          setShowSpellModal(false);
          setSelectedSpell(null);
        }}
      />
    </>
  );
}

export default MonsterDetailModal; 
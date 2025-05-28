import React, { useState } from 'react';
import { Modal, Table, Button } from 'react-bootstrap';
import { getSpellBySlug, SPELL_NAME_MAPPING } from '../services/spellDB';
import SharedSpellModal from './SharedSpellModal';
import { extractResistancesFromRules } from '../utils/creatureConversion';
import quickRefData from '../data/quickRef.json';

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

  // Helper: Map condition names to quickRefData Conditions
  const conditionList = quickRefData.find(q => q.name === 'Conditions')?.list || [];
  function linkifyConditions(text) {
    if (!text) return text;
    return text.replace(/@UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z]+)](\{([^}]+)\})?/g, (match, cond, _, label) => {
      const condName = (label || cond).replace(/-/g, ' ');
      const found = conditionList.find(c => c.name.toLowerCase() === condName.toLowerCase());
      if (found) {
        return `<a href='#' class='condition-link' data-condition='${found.name}'>${found.name}</a>`;
      } else {
        return label || cond;
      }
    });
  }

  const convertMonsterToCreature = () => {
    // Gather resistances from both attributes and rules
    const attrResistances = monster.system.attributes.resistances?.map(res => ({
      type: res.type,
      value: res.value || '',
      exceptions: res.exceptions || []
    })) || [];
    const ruleResistances = extractResistancesFromRules(monster).map(res => ({
      type: res.type,
      value: res.value || '',
      exceptions: res.exceptions || []
    }));
    // Merge, avoiding duplicates (by type+value+exceptions)
    const resistanceKey = r => `${r.type}-${r.value}-${(r.exceptions||[]).join(',')}`;
    const allResistancesMap = new Map();
    attrResistances.concat(ruleResistances).forEach(r => {
      allResistancesMap.set(resistanceKey(r), r);
    });
    const allResistances = Array.from(allResistancesMap.values());

    // Define the creature object first, so attacks can be added to it
    const calculateSpellStats = (monster) => {
      // Find the highest mental ability score (INT, WIS, or CHA)
      const mentalScores = {
        int: monster.system.abilities.int.mod,
        wis: monster.system.abilities.wis.mod,
        cha: monster.system.abilities.cha.mod
      };
      const highestMental = Math.max(...Object.values(mentalScores));
      
      // Calculate spell DC and attack modifier
      // DC = 10 + monster level + highest mental ability modifier
      // Spell Attack = monster level + highest mental ability modifier
      const spellDC = 10 + monster.level + highestMental;
      const spellAttackMod = monster.level + highestMental;
      
      return { spellDC, spellAttackMod };
    };

    const { spellDC, spellAttackMod } = calculateSpellStats(monster);

    const creature = {
      id: Date.now(),
      name: monster.name,
      hp: monster.system.attributes.hp.max,
      maxHp: monster.system.attributes.hp.max,
      ac: monster.system.attributes.ac.value,
      perception: monster.system.perception.value,
      fortitude: monster.system.saves.fortitude.value,
      reflex: monster.system.saves.reflex.value,
      will: monster.system.saves.will.value,
      level: monster.level,
      dc: spellDC,
      spellAttackMod: spellAttackMod,
      attacks: [],
      actions: [],
      resistances: allResistances,
      immunities: monster.system.attributes.immunities?.map(imm => ({
        type: imm.type,
        exceptions: imm.exceptions || []
      })) || [],
      weaknesses: monster.system.attributes.weaknesses?.map(weak => ({
        type: weak.type,
        value: weak.value || '',
        exceptions: weak.exceptions || []
      })) || [],
      items: monster.items
    };

    // Now add attacks and spells to the creature.attacks array
    if (monster.items) {
      monster.items.forEach(item => {
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
          const getSpellName = (item) => {
            if (item.system.publication?.remaster) {
              return item.name;
            }
            return SPELL_NAME_MAPPING[item.name] || item.name;
          };
          const spellAttack = {
            attackName: getSpellName(item),
            attackType: spellType,
            attackCategory: spellType,
            actions: item.system.time?.value || '2',
            range: item.system.range?.value || '',
            description: processDescription(item.system.description?.value),
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
            actions: item.system.actions?.value || null,
            description: item.system.description?.value || '',
            traits: item.system.traits?.value || []
          });
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
        <div dangerouslySetInnerHTML={{ __html: linkifyConditions(item.system?.description?.value || '') }} />
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

  const formatResistanceText = (res) => {
    let text = `${res.type} ${res.value}`;
    if (res.exceptions && res.exceptions.length > 0) {
      text += ` (except ${res.exceptions.join(', ')})`;
    }
    return text;
  };

  function renderRegularSpells(attacks) {
    const spells = attacks.filter(atk => (atk.attackCategory || atk.attackType) === 'regularSpell');
    if (spells.length === 0) return null;
    // Determine which columns to show
    const showRange = spells.some(s => s.range);
    const showTargets = spells.some(s => s.targets);
    const showDuration = spells.some(s => s.duration);
    return (
      <div className="mb-3">
        <strong>Regular Spells:</strong>
        <div className="table-responsive">
          <table className="table table-sm table-bordered align-middle mb-0">
            <thead>
              <tr>
                <th style={{ minWidth: 120 }}>Spell Name</th>
                {showRange && <th style={{ minWidth: 80 }}>Range</th>}
                {showTargets && <th style={{ minWidth: 80 }}>Targets</th>}
                {showDuration && <th style={{ minWidth: 80 }}>Duration</th>}
              </tr>
            </thead>
            <tbody>
              {spells.map((s, i) => (
                <tr key={i}>
                  <td><span style={{ fontWeight: 500 }}>{s.attackName}</span></td>
                  {showRange && <td>{s.range || ''}</td>}
                  {showTargets && <td>{s.targets || ''}</td>}
                  {showDuration && <td>{s.duration || ''}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

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

          {/* Regular Spells */}
          {renderRegularSpells(monster.attacks || [])}

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
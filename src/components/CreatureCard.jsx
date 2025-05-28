import React, { useState } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Trash, Pencil, Plus, Dash } from 'react-bootstrap-icons';
import { calculateCurrentResistances } from '../utils/creatureConversion';
import action1 from '../assets/action-1.png';
import action2 from '../assets/action-2.png';
import action3 from '../assets/action-3.png';
import freeAction from '../assets/action-free.png';
import reaction from '../assets/action-reaction.png';
import { CONDITIONS } from './ConditionsMenu';
import quickRefData from '../data/quickRef.json';

function CreatureCard({
  participant,
  currentTurn,
  renderStat,
  expandedAttacks,
  setExpandedAttacks,
  expandedSpells,
  setExpandedSpells,
  onDeleteClick,
  onWeakAdjustment,
  onEliteAdjustment,
  onEditCreatureClick,
  hpInputValues,
  tempHpInputValues,
  onHpInputChange,
  onTempHpInputChange,
  onHpAdd,
  onHpSubtract,
  onTempHpAdd
}) {
	
  // Helper function to check if a stat is affected by conditions
  const isStatAffectedByConditions = (participant, stat, attack = null) => {
    if (!participant.conditions) return false;
    return Object.entries(participant.conditions).some(([conditionId, data]) => {
      const condition = CONDITIONS[conditionId.toUpperCase().replace('-', '_')] ||
        Object.values(CONDITIONS).find(c => c.id === conditionId);
      if (!condition) return false;
      // For attack modifiers, check for per-type keys
      if ((stat === 'firstHitModifier' || stat === 'secondHitModifier' || stat === 'thirdHitModifier') && attack) {
        const type = (attack.attackCategory || attack.attackType || '').toLowerCase();
        let effectKey = '';
        if (type === 'melee') effectKey = 'melee' + stat.charAt(0).toUpperCase() + stat.slice(1);
        else if (type === 'ranged') effectKey = 'ranged' + stat.charAt(0).toUpperCase() + stat.slice(1);
        else if (type === 'spell') effectKey = 'spell' + stat.charAt(0).toUpperCase() + stat.slice(1);
        if (effectKey && effectKey in condition.effects) return true;
      }
      // For damage, only highlight if the condition affects the correct type
      if (stat === 'meleeDamage' && attack) {
        const type = (attack.attackCategory || attack.attackType || '').toLowerCase();
        if (type === 'melee' && 'meleeDamage' in condition.effects) return true;
        if (type === 'ranged' && 'rangedDamage' in condition.effects) return true;
        if (type === 'spell' && 'spellDamage' in condition.effects) return true;
      }
      // Check if the condition affects this stat (for non-attack stats)
      if (stat === 'ac' && 'ac' in condition.effects) return true;
      if (stat === 'dc' && 'dc' in condition.effects) return true;
      if (stat === 'perception' && 'perception' in condition.effects) return true;
      if (stat === 'fortitude' && 'fortitude' in condition.effects) return true;
      if (stat === 'reflex' && 'reflex' in condition.effects) return true;
      if (stat === 'will' && 'will' in condition.effects) return true;
      return false;
    });
  };

  // Helper function to render a stat with conditional styling
  const renderStatWithStyle = (stat, value, attack = null) => {
    const isAffected = isStatAffectedByConditions(participant, stat, attack);
    const isModified = participant.isWeak || participant.isElite;
    
    if (value === null || value === undefined || value === '' || (typeof value !== 'string' && typeof value !== 'number')) {
      return <span>—</span>;
    }
    
    let style = {};
    if (isAffected) {
      style.color = 'red';
    } else if (isModified) {
      style.color = '#ff6be4'; // Purple color for modified stats
    }
    
    return (
      <span style={style}>
        {value}
      </span>
    );
  };

  // Helper function to render attack modifiers
  const renderAttackModifiers = (attack) => {
    const modifiers = [
      attack.firstHitModifier,
      attack.secondHitModifier,
      attack.thirdHitModifier
    ].filter(mod => mod !== null && mod !== undefined && mod !== '');

    if (modifiers.length === 0) return null;

    return modifiers.map((mod, index) => (
      <React.Fragment key={index}>
        {renderStatWithStyle(['firstHitModifier', 'secondHitModifier', 'thirdHitModifier'][index], mod, attack)}
        {index < modifiers.length - 1 ? '/' : ''}
      </React.Fragment>
    ));
  };

  // Helper function to render damage
  const renderDamage = (attack) => {
    if (!attack.damage) return null;
    return (
      <span>
        {' ('}
        {renderStatWithStyle('meleeDamage', attack.damage, attack)}
        {')'}
      </span>
    );
  };

  const renderCreatureActions = (creature) => {
    if (!creature.actions || creature.actions.length === 0) return null;

    return (
      <div className="mt-2">
        <strong>Actions:</strong>
        <ul className="mb-0 ps-3">
          {creature.actions.map((action, index) => {
            const actionKey = `${creature.battleId}-action-${index}`;
            const isExpanded = expandedSpells[actionKey];
            let icon = null;
            if (action.actionType === 'action') {
              if (action.actions === '1') icon = action1;
              else if (action.actions === '2') icon = action2;
              else if (action.actions === '3') icon = action3;
            } else if (action.actionType === 'reaction') {
              icon = reaction;
            }

            return (
              <li 
                key={actionKey} 
                style={{ listStyleType: 'circle', cursor: action.description ? 'pointer' : 'default' }} 
                onClick={() => action.description && setExpandedSpells(prev => ({ ...prev, [actionKey]: !prev[actionKey] }))}
              >
                <span className="text-muted"></span> 
                <strong style={{ marginLeft: 4 }}>{action.name}</strong>
                {icon && (
                  <img
                    src={icon}
                    alt={`${action.actions} action(s)`}
                    style={{ height: '1.2em', verticalAlign: 'middle', marginLeft: 8, marginRight: 4 }}
                  />
                )}
                {action.traits && action.traits.length > 0 && (
                  <div className="d-flex gap-1 d-inline-flex ms-2">
                    {action.traits.map((trait, traitIndex) => (
                      <Badge key={traitIndex} bg="secondary">{trait}</Badge>
                    ))}
                  </div>
                )}
                {action.description && (
                  <span className="ms-2" style={{ fontSize: '0.8em', color: '#666' }}>{isExpanded ? '▼' : '▶'}</span>
                )}
                {isExpanded && action.description && (
                  <div
                    className="mt-1 mb-1"
                    style={{ marginLeft: 24, padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}
                  >
                    {renderSpellDescription(action.description)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  // Add renderRegularSpellsListLikeAttackSpells function
  const renderRegularSpellsListLikeAttackSpells = (attacks) => {
    if (!attacks) return null;
    const spells = attacks.filter(atk => (atk.attackCategory || atk.attackType) === 'regularSpell');
    if (spells.length === 0) return null;

    const conditionList = quickRefData.find(q => q.name === 'Conditions')?.list || [];

    const renderSpellDescription = (rawDescription) => {
      if (!rawDescription) return null;
      // Replace @UUID[...] with the text inside {...}
      let processed = rawDescription.replace(/@UUID\[[^\]]*\]\{([^}]*)\}/g, '$1');
      // Bold the keywords at the start of lines or after <p>
      processed = processed.replace(/(>|^)(Critical Success|Success|Failure|Critical Failure)(:|\s)/g, (match, p1, p2, p3) => `${p1}<strong>${p2}</strong>${p3}`);
      // If it doesn't look like HTML, add <p> for each line
      if (!/<[a-z][\s\S]*>/i.test(processed)) {
        processed = processed
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => `<p>${line}</p>`)
          .join('');
      }
      // Add linkifyConditions logic
      const linkifyConditions = (text) => {
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
      };
      processed = linkifyConditions(processed);
      return <div dangerouslySetInnerHTML={{ __html: processed }} />;
    };

    return (
      <div className="mt-2">
        <strong>Regular Spells:</strong>
        <ul className="mb-0 ps-3">
          {spells.map((atk, i) => {
            const spellKey = `${participant.battleId}-regularSpell-${i}`;
            const isExpanded = expandedSpells[spellKey];
            let icon = null;
            if (atk.actions === '1') icon = action1;
            else if (atk.actions === '2') icon = action2;
            else if (atk.actions === '3') icon = action3;
            else if (atk.actions === 'free') icon = freeAction;
            return (
              atk.attackName ? (
                <li key={spellKey} style={{ listStyleType: 'circle', cursor: atk.description ? 'pointer' : 'default' }} onClick={() => atk.description && setExpandedSpells(prev => ({ ...prev, [spellKey]: !prev[spellKey] }))}>
                  <span className="text-muted"></span> <strong style={{ marginLeft: 4 }}>{atk.attackName}</strong>
                  {icon && (
                    <img
                      src={icon}
                      alt={`${atk.actions} action(s)`}
                      style={{ height: '1.2em', verticalAlign: 'middle', marginLeft: 8, marginRight: 4 }}
                    />
                  )}
                  {atk.range && <span>, Range: {atk.range}</span>}
                  {atk.targets && <span>, Targets: {atk.targets}</span>}
                  {atk.duration && <span>, Duration: {atk.duration}</span>}
                  {atk.description && (
                    <span className="ms-2" style={{ fontSize: '0.8em', color: '#666' }}>{isExpanded ? '▼' : '▶'}</span>
                  )}
                  {isExpanded && atk.description && (
                    <div
                      className="mt-1 mb-1"
                      style={{ marginLeft: 24, padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}
                    >
                      {renderSpellDescription(atk.description)}
                    </div>
                  )}
                </li>
              ) : null
            );
          })}
        </ul>
      </div>
    );
  };

  // Add renderSpellDescription function at component level since it's used by both actions and spells
  const renderSpellDescription = (rawDescription) => {
    if (!rawDescription) return null;
    // Replace @UUID[...] with the text inside {...}
    let processed = rawDescription.replace(/@UUID\[[^\]]*\]\{([^}]*)\}/g, '$1');
    // Bold the keywords at the start of lines or after <p>
    processed = processed.replace(/(>|^)(Critical Success|Success|Failure|Critical Failure)(:|\s)/g, (match, p1, p2, p3) => `${p1}<strong>${p2}</strong>${p3}`);
    // If it doesn't look like HTML, add <p> for each line
    if (!/<[a-z][\s\S]*>/i.test(processed)) {
      processed = processed
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => `<p>${line}</p>`)
        .join('');
    }
    // Add linkifyConditions logic
    const linkifyConditions = (text) => {
      if (!text) return text;
      return text.replace(/@UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z]+)](\{([^}]+)\})?/g, (match, cond, _, label) => {
        const condName = (label || cond).replace(/-/g, ' ');
        const found = quickRefData.find(q => q.name === 'Conditions')?.list.find(c => c.name.toLowerCase() === condName.toLowerCase());
        if (found) {
          return `<a href='#' class='condition-link' data-condition='${found.name}'>${found.name}</a>`;
        } else {
          return label || cond;
        }
      });
    };
    processed = linkifyConditions(processed);
    return <div dangerouslySetInnerHTML={{ __html: processed }} />;
  };

  return (
    <div className="creature-card">
      <div className="d-flex flex-column">
        <div className="mb-1">
          HP: {participant.hp} / {participant.maxHp !== undefined && participant.maxHp !== '' ? participant.maxHp : participant.hp}
          {participant.tempHp > 0 && (
            <span className="text-info ms-2">(+{participant.tempHp} temp)</span>
          )}
        </div>
        <div className="d-flex flex-column ms-2 mb-1" style={{ gap: '0.5rem' }}>
          <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
            <input
              type="number"
              className="form-control d-inline-block"
              style={{ width: 60, height: 32, fontSize: '0.9rem', padding: '2px 8px' }}
              value={hpInputValues?.[participant.battleId] || ''}
              onChange={e => onHpInputChange?.(participant.battleId, e.target.value)}
              placeholder="HP"
            />
            <Button
              variant="outline-success"
              size="sm"
              className="ms-1"
              style={{ height: 32, width: 40, padding: 0, fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => onHpAdd?.(participant)}
              disabled={!hpInputValues?.[participant.battleId] || isNaN(Number(hpInputValues?.[participant.battleId]))}
            >
              <Plus />
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              className="ms-1"
              style={{ height: 32, width: 40, padding: 0, fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => onHpSubtract?.(participant)}
              disabled={!hpInputValues?.[participant.battleId] || isNaN(Number(hpInputValues?.[participant.battleId]))}
            >
              <Dash />
            </Button>
          </div>
          <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
            <input
              type="number"
              className="form-control d-inline-block"
              style={{ width: 60, height: 32, fontSize: '0.9rem', padding: '2px 8px' }}
              value={tempHpInputValues?.[participant.battleId] || ''}
              onChange={e => onTempHpInputChange?.(participant.battleId, e.target.value)}
              placeholder="Temp"
            />
            <Button
              variant="outline-info"
              size="sm"
              className="ms-1"
              style={{ height: 32, width: 40, padding: 0, fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => onTempHpAdd?.(participant)}
              disabled={!tempHpInputValues?.[participant.battleId] || isNaN(Number(tempHpInputValues?.[participant.battleId]))}
            >
              <Plus />
            </Button>
          </div>
        </div>
        <div className="d-flex align-items-center mt-1">
          <span className="ms-2">AC: {renderStatWithStyle('ac', participant.ac || 0)}</span>
          {participant.level !== undefined && participant.level !== null && (
            <span className="ms-2">Level: {renderStatWithStyle('level', participant.level)}</span>
          )}
        </div>
        <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
          Fortitude: {renderStatWithStyle('fortitude', participant.fortitude)}
          <span className="ms-2">
            Reflex: {renderStatWithStyle('reflex', participant.reflex)}
          </span>
          Will: {renderStatWithStyle('will', participant.will)}
        </div>

        <div className="d-flex align-items-center mt-1" style={{ gap: '0.5rem' }}>
          DC: {renderStatWithStyle('dc', participant.dc)}
          <span className="ms-2">
            Spell Attack: {renderStatWithStyle('spellAttackMod', participant.spellAttackMod)}
            {participant.isWeak ? ' (-4 dmg)' : participant.isElite ? ' (+4 dmg)' : ''}
          </span>
        </div>

        {(() => {
          const currentResistances = calculateCurrentResistances(participant);
          return currentResistances && currentResistances.length > 0 && (
            <div className="mt-2">
              <strong>Resistances:</strong>
              <ul className={currentResistances.length > 2 ? "mb-0 ps-3 d-flex flex-wrap gap-2 list-unstyled flex-row" : "mb-0 ps-3"}>
                {currentResistances.map((resistance, i) => (
                  <li key={`${participant.battleId}-resistance-${i}`} style={{ listStyleType: currentResistances.length > 2 ? 'none' : 'disc' }}>
                    {resistance.type} {resistance.value}
                    {currentResistances.length > 2 && i < currentResistances.length - 1 ? ',' : ''}
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

        {((participant.attacks && Array.isArray(participant.attacks) && participant.attacks.length > 0) || (participant.actions && participant.actions.length > 0)) && (
          <div>
            <div
              className="mt-2 mb-2"
              style={{ 
                cursor: 'pointer',
                fontSize: '1.1em',
                fontWeight: 'bold',
                color: '#0d6efd',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onClick={() => setExpandedAttacks(prev => ({
                ...prev,
                [participant.battleId]: !prev[participant.battleId]
              }))}
            >
              <span>Attacks & Actions</span>
              <span style={{ fontSize: '0.8em' }}>{expandedAttacks[participant.battleId] ? '▼' : '▶'}</span>
            </div>

            {expandedAttacks[participant.battleId] && (
              <>
                {participant.attacks && Array.isArray(participant.attacks) && participant.attacks.length > 0 && (
                  <>
                    {/* Melee Attacks Section */}
                    {participant.attacks.some(atk => (atk.attackCategory || atk.attackType) === 'melee') && (
                      <div className="mt-2">
                        <strong>Melee Attacks:</strong>
                        <ul className="mb-0 ps-3">
                          {participant.attacks.filter(atk => (atk.attackCategory || atk.attackType) === 'melee').map((atk, i) => (
                            atk.attackName ? (
                              <li key={`${participant.battleId}-melee-${i}`} style={{ listStyleType: 'disc' }}>
                                {atk.attackName} {renderAttackModifiers(atk)}
                                {renderDamage(atk)}
                              </li>
                            ) : null
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Ranged Attacks Section */}
                    {participant.attacks.some(atk => (atk.attackCategory || atk.attackType) === 'ranged') && (
                      <div className="mt-2">
                        <strong>Ranged Attacks:</strong>
                        <ul className="mb-0 ps-3">
                          {participant.attacks.filter(atk => (atk.attackCategory || atk.attackType) === 'ranged').map((atk, i) => (
                            atk.attackName ? (
                              <li key={`${participant.battleId}-ranged-${i}`} style={{ listStyleType: 'disc' }}>
                                {atk.attackName} {renderAttackModifiers(atk)}
                                {renderDamage(atk)}
                              </li>
                            ) : null
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {renderRegularSpellsListLikeAttackSpells(participant.attacks)}
                
                {participant.actions && participant.actions.length > 0 && (
                  <div className="mt-2">
                    {renderCreatureActions(participant)}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="d-flex gap-2 ms-auto">
        <Button
          variant={currentTurn === participant.battleId ? "light" : "outline-danger"}
          size="sm"
          onClick={() => onDeleteClick(participant)}
        >
          <Trash />
        </Button>
        <Button
          variant={currentTurn === participant.battleId ? "light" : participant.isWeak ? "warning" : "outline-warning"}
          size="sm"
          className="ms-1"
          onClick={() => onWeakAdjustment(participant)}
        >
          {participant.isWeak ? 'WEAK ✓' : 'WEAK'}
        </Button>
        <Button
          variant={currentTurn === participant.battleId ? "light" : participant.isElite ? "success" : "outline-success"}
          size="sm"
          className="ms-1"
          onClick={() => onEliteAdjustment(participant)}
        >
          {participant.isElite ? 'ELITE ✓' : 'ELITE'}
        </Button>
        <Button
          variant={currentTurn === participant.battleId ? "light" : "outline-primary"}
          size="sm"
          className="ms-1"
          onClick={() => onEditCreatureClick(participant)}
        >
          <Pencil />
        </Button>
      </div>
    </div>
  );
}

export default CreatureCard; 
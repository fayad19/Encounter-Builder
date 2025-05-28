import React from 'react';
import { Button } from 'react-bootstrap';
import { Plus, Dash } from 'react-bootstrap-icons';

function PlayerCard({
  participant,
  currentTurn,
  hpInputValues,
  tempHpInputValues,
  onHpInputChange,
  onTempHpInputChange,
  onHpAdd,
  onHpSubtract,
  onTempHpAdd
}) {
  const renderStatWithStyle = (stat, value) => {
    if (value === null || value === undefined || value === '' || (typeof value !== 'string' && typeof value !== 'number')) {
      return <span>—</span>;
    }
    return <span>{value}</span>;
  };

  return (
    <div className="d-flex flex-column align-items-start ms-2 mb-1">
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
            value={hpInputValues[participant.battleId] || ''}
            onChange={e => onHpInputChange(participant.battleId, e.target.value)}
            placeholder="HP"
          />
          <Button
            variant="outline-success"
            size="sm"
            className="ms-1"
            style={{ height: 32, width: 40, padding: 0, fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => onHpAdd(participant)}
            disabled={!hpInputValues[participant.battleId] || isNaN(Number(hpInputValues[participant.battleId]))}
          >
            <Plus />
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            className="ms-1"
            style={{ height: 32, width: 40, padding: 0, fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => onHpSubtract(participant)}
            disabled={!hpInputValues[participant.battleId] || isNaN(Number(hpInputValues[participant.battleId]))}
          >
            <Dash />
          </Button>
        </div>
        <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
          <input
            type="number"
            className="form-control d-inline-block"
            style={{ width: 60, height: 32, fontSize: '0.9rem', padding: '2px 8px' }}
            value={tempHpInputValues[participant.battleId] || ''}
            onChange={e => onTempHpInputChange(participant.battleId, e.target.value)}
            placeholder="Temp"
          />
          <Button
            variant="outline-info"
            size="sm"
            className="ms-1"
            style={{ height: 32, width: 40, padding: 0, fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => onTempHpAdd(participant)}
            disabled={!tempHpInputValues[participant.battleId] || isNaN(Number(tempHpInputValues[participant.battleId]))}
          >
            <Plus />
          </Button>
        </div>
      </div>
      <div className="mt-1">
        <span className="ms-2">AC: {renderStatWithStyle('ac', participant.ac || 0)}</span>
        {participant.level !== undefined && participant.level !== null && (
          <span className="ms-2">Level: {renderStatWithStyle('level', participant.level)}</span>
        )}
      </div>
    </div>
  );
}

export default PlayerCard; 
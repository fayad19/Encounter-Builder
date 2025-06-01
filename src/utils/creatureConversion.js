// Utility for extracting resistances from monster rules
export function extractResistancesFromRules(monster) {
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
}

// Calculate current resistances based on current HP percentage
export function calculateCurrentResistances(creature) {
  // If the monster has items/rules, use the existing logic
  if (creature.items) {
    const currentHpPercent = (creature.hp / creature.maxHp) * 100;
    const resistances = new Map();

    // First add all static resistances (from attributes)
    if (creature.resistances) {
      creature.resistances.forEach(res => {
        const key = `${res.type}-${(res.exceptions || []).join(',')}`;
        resistances.set(key, res);
      });
    }

    // Then process dynamic resistances from rules
    creature.items?.forEach(item => {
      if (item.system?.rules) {
        item.system.rules.forEach(rule => {
          if (rule.key === 'Resistance') {
            let matches = true;
            if (rule.predicate && Array.isArray(rule.predicate)) {
              // Evaluate all predicates (supporting multiple conditions)
              for (const pred of rule.predicate) {
                if (pred.lt && Array.isArray(pred.lt) && pred.lt[0] === 'hp-percent') {
                  if (!(currentHpPercent < pred.lt[1])) matches = false;
                }
                if (pred.gte && Array.isArray(pred.gte) && pred.gte[0] === 'hp-percent') {
                  if (!(currentHpPercent >= pred.gte[1])) matches = false;
                }
              }
            }
            if (matches) {
              // Use type+exceptions as key so only the last matching rule for a type+exceptions applies
              const key = `${rule.type}-${(rule.exceptions || []).join(',')}`;
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
  }

  // Fallback for legacy/old creatures
  let resistances = [...(creature.resistances || [])];
  return resistances;
}

export function convertMonsterToCreature(monster) {
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
    perception: monster.system.perception.mod,
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
    items: monster.items,
    skills: Object.entries(monster.system.skills || {}).reduce((acc, [skillName, skillData]) => {
      // Use base as the main modifier
      const value = skillData.base || 0;
      if (skillData.special && Array.isArray(skillData.special) && skillData.special.length > 0) {
        acc[skillName] = { value, special: skillData.special };
      } else {
        acc[skillName] = value;
      }
      return acc;
    }, {})
  };

  // Now add attacks and spells to the creature.attacks array
  if (monster.items) {
    monster.items.forEach(item => {
      if (item.type === 'melee' || item.type === 'ranged') {
        const baseModifier = item.system.bonus?.value || 0;
        const traits = item.system.traits?.value || [];
        const isAgile = traits.includes('agile');
        // Calculate MAP values based on the base modifier and agile trait
        // For agile attacks: -4/-8 instead of -5/-10
        const firstHitModifier = baseModifier;
        const secondHitModifier = baseModifier + (isAgile ? -4 : -5);
        const thirdHitModifier = baseModifier + (isAgile ? -8 : -10);
        creature.attacks.push({
          attackName: item.name,
          attackType: item.type,
          attackCategory: item.type,
          firstHitModifier: firstHitModifier,
          secondHitModifier: secondHitModifier,
          thirdHitModifier: thirdHitModifier,
          damage: Object.values(item.system.damageRolls || {})
            .map(roll => `${roll.damage} ${roll.damageType}`)
            .join(' plus '),
          traits: traits
        });
      } else if (item.type === 'spell') {
        const hasDirectDamage = item.system.damage && Object.keys(item.system.damage).length > 0;
        const spellType = hasDirectDamage ? 'spell' : 'regularSpell';
        const getSpellName = (item) => {
          if (item.system.publication?.remaster) {
            return item.name;
          }
          return item.name;
        };
        const spellAttack = {
          attackName: getSpellName(item),
          attackType: spellType,
          attackCategory: spellType,
          actions: item.system.time?.value || '2',
          range: item.system.range?.value || '',
          description: item.system.description?.value,
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
} 
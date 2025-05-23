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
  if (!creature.items) return creature.resistances;

  const currentHpPercent = (creature.hp / creature.maxHp) * 100;
  const resistances = new Map();

  // First add all static resistances (from attributes)
  creature.resistances.forEach(res => {
    const key = `${res.type}-${res.value}-${(res.exceptions || []).join(',')}`;
    resistances.set(key, res);
  });

  // Then process dynamic resistances from rules
  creature.items?.forEach(item => {
    if (item.system?.rules) {
      item.system.rules.forEach(rule => {
        if (rule.key === 'Resistance') {
          const hpPredicate = rule.predicate?.find(p => p.lt || p.gte);
          if (hpPredicate) {
            const threshold = hpPredicate.lt ? hpPredicate.lt[1] : hpPredicate.gte[1];
            const isAbove = hpPredicate.gte !== undefined;
            const isBelow = hpPredicate.lt !== undefined;

            // Only include if the HP condition is met
            if ((isAbove && currentHpPercent >= threshold) || 
                (isBelow && currentHpPercent < threshold)) {
              const key = `${rule.type}-${rule.value}-${(rule.exceptions || []).join(',')}`;
              resistances.set(key, {
                type: rule.type,
                value: rule.value,
                exceptions: rule.exceptions || [],
                predicate: rule.predicate
              });
            }
          }
        }
      });
    }
  });

  return Array.from(resistances.values());
} 
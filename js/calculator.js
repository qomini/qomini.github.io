// Main damage calculation engine
class DamageCalculator {
  constructor(characterStats, targetStats, buffs = [], debuffs = [], gameMode = 'pve') {
    this.character = characterStats;
    this.target = targetStats;
    this.buffs = buffs;
    this.debuffs = debuffs;
    this.gameMode = gameMode;
    
    // Calculate buff/debuff effects
    this.buffEffects = calculateBuffEffects(buffs, characterStats);
    this.debuffEffects = calculateDebuffEffects(debuffs, targetStats, characterStats.level, gameMode);
    
    // Apply stat bonuses from buffs
    this.effectiveStats = {
      ...characterStats,
      dam: characterStats.dam + this.buffEffects.bonusStats.dam,
      hit: Math.min(255, characterStats.hit + this.buffEffects.bonusStats.hit),
      might: Math.min(255, characterStats.might + this.buffEffects.bonusStats.might),
      will: Math.min(255, characterStats.will + this.buffEffects.bonusStats.will),
      grace: Math.min(255, characterStats.grace + this.buffEffects.bonusStats.grace),
      mana: Math.floor(characterStats.mana * this.buffEffects.manaMultiplier)
    };
    
    // Apply AC modifiers from debuffs to target
    this.effectiveTarget = {
      ...targetStats,
      ac: (targetStats.ac || 0) + this.debuffEffects.acModifier
    };
  }

  // Calculate damage for a specific spell
  calculateSpellDamage(spellId) {
    const spell = SPELLS[spellId];
    if (!spell || !spell.calculateDamage) {
      console.warn(`Spell ${spellId} not found or has no damage calculation`);
      return 0;
    }
    
    try {
      // Use effective stats (with buffs applied)
      const baseDamage = spell.calculateDamage(this.effectiveStats, this.effectiveTarget);
      
      // Apply damage multipliers from buffs and debuffs
      const multipliedDamage = this.applyDamageMultipliers(baseDamage);
      
      // Apply AC modifier last (uses effective target AC which includes debuff modifiers)
      return this.applyACModifier(multipliedDamage);
    } catch (error) {
      console.error(`Error calculating damage for ${spellId}:`, error);
      return 0;
    }
  }

  // Apply damage multipliers from buffs and debuffs
  applyDamageMultipliers(damage) {
    if (damage === 0) return 0; // Don't modify unknown formulas
    
    const totalMultiplier = this.buffEffects.totalDamageMultiplier * this.debuffEffects.totalDamageMultiplier;
    
    // Handle objects with multiple damage values
    if (typeof damage === 'object' && damage !== null) {
      const modified = {};
      
      for (const key in damage) {
        if (typeof damage[key] === 'number') {
          modified[key] = Math.floor(damage[key] * totalMultiplier);
        } else {
          modified[key] = damage[key];
        }
      }
      
      return modified;
    }
    
    // Simple number damage
    return Math.floor(damage * totalMultiplier);
  }

  // Apply AC (Armor Class) modifier to damage
  // Positive AC increases damage, negative AC decreases damage
  // AC is clamped: -127 to -80 (effective), -80 to +100 (normal range)
  applyACModifier(damage) {
    if (damage === 0) return 0; // Don't modify unknown formulas
    
    const ac = this.effectiveTarget.ac || 0;
    
    // Clamp AC to game limits
    const clampedAC = Math.max(-127, Math.min(100, ac));
    
    // Effective AC bottoms out at -80
    const effectiveAC = Math.max(-80, clampedAC);
    
    // Handle objects with multiple damage values
    if (typeof damage === 'object' && damage !== null) {
      const modified = {};
      
      // Apply AC to all numeric properties
      for (const key in damage) {
        if (typeof damage[key] === 'number') {
          modified[key] = Math.floor(damage[key] * (1 + effectiveAC / 100));
        } else {
          modified[key] = damage[key];
        }
      }
      
      return modified;
    }
    
    // Simple number damage
    return Math.floor(damage * (1 + effectiveAC / 100));
  }

  // Get all available spells for the character with calculated damage
  getAvailableSpells() {
    // Get spell IDs available for this class/level
    const classData = CLASSES[this.character.class];
    if (!classData) return [];
    
    const levelIndex = LEVEL_TIERS.indexOf(this.character.level);
    if (levelIndex === -1) return [];
    
    let spellsWithTiers = [];
    
    // Collect spells from each tier up to current level
    for (let i = 0; i <= levelIndex; i++) {
      const tierName = LEVEL_TIERS[i];
      const tierSpells = classData.spellsByLevel[tierName];
      
      if (tierSpells) {
        tierSpells.forEach(spellId => {
          const spell = SPELLS[spellId];
          if (spell) {
            spellsWithTiers.push({
              id: spellId,
              name: spell.name,
              description: spell.description,
              damage: this.calculateSpellDamage(spellId),
              levelTier: tierName
            });
          }
        });
      }
    }
    
    return spellsWithTiers;
  }

  // Update character or target stats
  updateCharacter(newStats) {
    this.character = { ...this.character, ...newStats };
    this.recalculateEffects();
  }

  updateTarget(newStats) {
    this.target = { ...this.target, ...newStats };
    this.recalculateEffects();
  }

  updateBuffs(newBuffs) {
    this.buffs = newBuffs;
    this.recalculateEffects();
  }

  updateDebuffs(newDebuffs) {
    this.debuffs = newDebuffs;
    this.recalculateEffects();
  }

  recalculateEffects() {
    // Recalculate buff/debuff effects
    this.buffEffects = calculateBuffEffects(this.buffs, this.character);
    this.debuffEffects = calculateDebuffEffects(this.debuffs, this.target, this.character.level, this.gameMode);
    
    // Recalculate effective stats
    this.effectiveStats = {
      ...this.character,
      dam: this.character.dam + this.buffEffects.bonusStats.dam,
      hit: Math.min(255, this.character.hit + this.buffEffects.bonusStats.hit),
      might: Math.min(255, this.character.might + this.buffEffects.bonusStats.might),
      will: Math.min(255, this.character.will + this.buffEffects.bonusStats.will),
      grace: Math.min(255, this.character.grace + this.buffEffects.bonusStats.grace),
      mana: Math.floor(this.character.mana * this.buffEffects.manaMultiplier)
    };
    
    // Recalculate effective target
    this.effectiveTarget = {
      ...this.target,
      ac: (this.target.ac || 0) + this.debuffEffects.acModifier
    };
  }
}

// Status effects: Buffs (character) and Debuffs (target)

const BUFFS = {
  // ========== WARRIOR BUFFS ==========
  bless: {
    name: "Bless",
    description: "+5 Hit",
    hitBonus: 5,
    applicableClasses: ['warrior'],
    selfOnly: true,
    mutuallyExclusive: ['greater_blessing']
  },

  potence: {
    name: "Potence",
    description: "+5 Dam",
    damageBonus: 5,
    applicableClasses: ['warrior'],
    selfOnly: true,
    mutuallyExclusive: ['greater_potence']
  },

  greater_blessing: {
    name: "Greater blessing",
    description: "+10 Hit",
    hitBonus: 10,
    applicableClasses: ['warrior'],
    selfOnly: true,
    mutuallyExclusive: ['bless']
  },

  greater_potence: {
    name: "Greater potence",
    description: "+10 Dam",
    damageBonus: 10,
    applicableClasses: ['warrior'],
    selfOnly: true,
    mutuallyExclusive: ['potence']
  },

  limit_breaker: {
    name: "Limit breaker",
    description: "Doubles damage",
    damageMultiplier: 2.0,
    applicableClasses: ['warrior'],
    selfOnly: true
  },

  // ========== ROGUE BUFFS ==========
  
  // ========== MAGE BUFFS ==========
  arcane_power: {
    name: "Arcane Power",
    description: "+5 to +25 Dam (scales with level)",
    damageBonus: (level) => {
      const tierIndex = LEVEL_TIERS.indexOf(level);
      if (tierIndex >= 4) return 25; // Sam San
      if (tierIndex >= 3) return 20; // Ee San
      if (tierIndex >= 2) return 15; // Il San
      if (tierIndex >= 1) return 10; // 99
      return 5; // Below 99
    },
    applicableClasses: ['mage'],
    selfOnly: true
  },

  // ========== POET BUFFS ==========
  angels_blessing_buff: {
    name: "Angel's blessing",
    description: "+7 Might, +6 Will, +5 Grace",
    mightBonus: 7,
    willBonus: 6,
    graceBonus: 5,
    applicableClasses: ['warrior', 'rogue', 'mage', 'poet'],
    selfOnly: false
  },

  empower: {
    name: "Empower",
    description: "+20% damage",
    damageMultiplier: 1.20,
    applicableClasses: ['warrior', 'rogue', 'mage', 'poet'],
    selfOnly: false
  },

  zen_mode: {
    name: "Zen mode",
    description: "+10% max mana, +20 Will, +20 Dam",
    willBonus: 20,
    damageBonus: 20,
    manaMultiplier: 1.10,
    applicableClasses: ['poet'],
    selfOnly: true
    // TODO: +10% damage to Retribution skill specifically
  }
};

const DEBUFFS = {
  // ========== WARRIOR DEBUFFS ==========
  
  // ========== ROGUE DEBUFFS ==========
  corrode_armor: {
    name: "Corrode armor",
    description: "+10 AC (PvP) / +8 AC (PvE)",
    acModifier: 8, // PvE value
    acModifierPvP: 10,
    mutuallyExclusive: ['dissolve_armor']
  },

  dissolve_armor: {
    name: "Dissolve armor",
    description: "+15 AC (PvP) / +10 AC (PvE)",
    acModifier: 10, // PvE value
    acModifierPvP: 15,
    mutuallyExclusive: ['corrode_armor']
  },

  sleep_dart: {
    name: "Sleep Dart",
    description: "1.5x damage (PvE) / 1.1x (PvP) / 1.2x (PvE Boss)",
    damageMultiplier: 1.5, // PvE value
    damageMultiplierPvP: 1.1,
    damageMultiplierPvEBoss: 1.2
    // TODO: Add isBoss checkbox when implementing boss mechanics
  },

  // ========== MAGE DEBUFFS ==========
  corrupted_armor_vex: {
    name: "Corrupted Armor/Vex",
    description: "+15 AC",
    acModifier: 15,
    mutuallyExclusive: ['scourge']
  },

  doze_trance: {
    name: "Doze/Trance",
    description: "1.3x damage taken",
    damageMultiplier: 1.3
  },
  
  // ========== POET DEBUFFS ==========
  // Note: Some "debuffs" here protect the target (reducing your damage output)
  // They're in the debuffs section because they're cast ON the target
  
  scourge: {
    name: "Scourge",
    description: "+35 AC (PvE) / +50 AC (PvP)",
    acModifier: 35, // PvE value
    acModifierPvP: 50,
    mutuallyExclusive: ['corrupted_armor_vex']
  },

  angels_blessing_debuff: {
    name: "Angel's blessing (Protection)",
    description: "45% damage reduction (target takes less damage)",
    damageMultiplier: 0.55 // Target takes 55% of normal damage (45% reduction)
  }
};

// Helper function to calculate effective buffs
function calculateBuffEffects(selectedBuffs, characterStats) {
  let totalDamageMultiplier = 1.0;
  let bonusStats = {
    dam: 0,
    hit: 0,
    might: 0,
    will: 0,
    grace: 0,
    mana: 0
  };
  let manaMultiplier = 1.0;

  selectedBuffs.forEach(buffId => {
    const buff = BUFFS[buffId];
    if (!buff) return;

    // Apply damage multipliers
    if (buff.damageMultiplier) {
      totalDamageMultiplier *= buff.damageMultiplier;
    }

    // Apply damage bonus (like Arcane Power, Zen mode, Potence, etc.)
    if (buff.damageBonus) {
      const bonus = typeof buff.damageBonus === 'function' 
        ? buff.damageBonus(characterStats.level)
        : buff.damageBonus;
      bonusStats.dam += bonus;
    }

    // Apply stat bonuses
    if (buff.hitBonus) bonusStats.hit += buff.hitBonus;
    if (buff.mightBonus) bonusStats.might += buff.mightBonus;
    if (buff.willBonus) bonusStats.will += buff.willBonus;
    if (buff.graceBonus) bonusStats.grace += buff.graceBonus;
    
    // Apply mana multiplier (Zen mode)
    if (buff.manaMultiplier) {
      manaMultiplier *= buff.manaMultiplier;
    }
  });

  return { totalDamageMultiplier, bonusStats, manaMultiplier };
}

// Helper function to calculate effective debuffs
function calculateDebuffEffects(selectedDebuffs, targetStats, characterLevel, gameMode = 'pve') {
  let totalDamageMultiplier = 1.0;
  let acModifier = 0;
  const isBoss = targetStats.isBoss || false;
  const isPvP = gameMode === 'pvp';

  selectedDebuffs.forEach(debuffId => {
    const debuff = DEBUFFS[debuffId];
    if (!debuff) return;

    // Apply damage multipliers (with boss/PvP variants)
    if (debuff.damageMultiplier) {
      let multiplier = debuff.damageMultiplier;
      
      // Special case for Sleep Dart: check for boss/PvP variants
      if (debuffId === 'sleep_dart') {
        if (isPvP && debuff.damageMultiplierPvP) {
          multiplier = debuff.damageMultiplierPvP;
        } else if (isBoss && debuff.damageMultiplierPvEBoss) {
          multiplier = debuff.damageMultiplierPvEBoss;
        }
      }
      
      totalDamageMultiplier *= multiplier;
    }

    // Apply AC modifiers (with PvP variants)
    if (debuff.acModifier) {
      let modifier = typeof debuff.acModifier === 'function'
        ? debuff.acModifier(characterLevel)
        : debuff.acModifier;
      
      // Use PvP AC modifier if in PvP mode and variant exists
      if (isPvP && debuff.acModifierPvP) {
        modifier = debuff.acModifierPvP;
      }
      
      acModifier += modifier;
    }

    // Apply percentage-based AC modifiers
    if (debuff.acPercentModifier) {
      const baseAC = targetStats.ac || 0;
      acModifier += Math.floor(Math.abs(baseAC) * debuff.acPercentModifier);
    }
  });

  return { totalDamageMultiplier, acModifier };
}

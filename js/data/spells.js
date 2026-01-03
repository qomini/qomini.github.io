// Spell definitions from originaltk.com
// Stats available: vita, mana, dam, hit, might, will, grace
// Target stats: ac, vita

const SPELLS = {
  // ========== WARRIOR SPELLS ==========
  
  dragons_fist: {
    name: "Dragon's fist",
    description: ".25 x Maximum Vita + 500",
    calculateDamage: (stats, target) => {
      return Math.floor(0.25 * stats.vita + 500);
    }
  },

  devastating_blow: {
    name: "Devastating blow",
    description: ".15 x Base Vita",
    calculateDamage: (stats, target) => {
      return Math.floor(0.15 * stats.vita);
    }
  },

  berserk: {
    name: "Berserk",
    description: "1.25 x Current Vita",
    calculateDamage: (stats, target) => {
      return Math.floor(1.25 * stats.vita);
    }
  },

  whirlwind: {
    name: "Whirlwind",
    description: "1.575 x Current Vita",
    calculateDamage: (stats, target) => {
      return Math.floor(1.575 * stats.vita);
    }
  },

  battle_storm: {
    name: "Battle storm",
    description: "1.5 x Current Vita",
    calculateDamage: (stats, target) => {
      return Math.floor(1.5 * stats.vita);
    }
  },

  assault: {
    name: "Assault",
    description: "1.75 x Current Vita",
    calculateDamage: (stats, target) => {
      return Math.floor(1.75 * stats.vita);
    }
  },

  dragons_convulsion: {
    name: "Dragon's convulsion",
    description: ".25 x Current Mana + .075 x Current Vita per tick (12 ticks)",
    calculateDamage: (stats, target) => {
      let perTick = 0.25 * stats.mana + 0.075 * stats.vita;
      return Math.floor(perTick * 12);
    }
  },

  siege: {
    name: "Siege",
    description: "1.875 x Current Vita + .5 x Current Mana",
    calculateDamage: (stats, target) => {
      return Math.floor(1.875 * stats.vita + 0.5 * stats.mana);
    }
  },

  // ========== ROGUE SPELLS ==========

  dagger_toss: {
    name: "Dagger toss",
    description: ".25 x Base Mana + 10 x Max Grace + 250",
    calculateDamage: (stats, target) => {
      return Math.floor(0.25 * stats.mana + 10 * stats.grace + 250);
    }
  },

  desperate_attack: {
    name: "Desperate attack",
    description: "1.5 x Current Vita + 1.5 x Current Mana",
    calculateDamage: (stats, target) => {
      return Math.floor(1.5 * stats.vita + 1.5 * stats.mana);
    }
  },

  lethal_strike: {
    name: "Lethal strike",
    description: "0.5 x Current Vita + 3 x Current Mana",
    calculateDamage: (stats, target) => {
      return Math.floor(0.5 * stats.vita + 3 * stats.mana);
    }
  },

  bladestorm: {
    name: "Bladestorm",
    description: "((2.5 x Current Vita) + (9.15 x Current Mana x 0.8)) x (Grace/100)",
    calculateDamage: (stats, target) => {
      let vitaPart = 2.5 * stats.vita;
      let manaPart = 9.15 * stats.mana * 0.8;
      return Math.floor((vitaPart + manaPart) * (stats.grace / 100));
    }
  },

  focused_blow: {
    name: "Focused blow",
    description: "2.5 x Current Vita",
    calculateDamage: (stats, target) => {
      return Math.floor(2.5 * stats.vita);
    }
  },

  bomb_barrage: {
    name: "Bomb barrage",
    description: ".145 x Target Max Vita + .295 x Target Max Mana",
    calculateDamage: (stats, target) => {
      return Math.floor(0.145 * target.vita + 0.295 * target.mana);
    }
  },

  blade_dancer: {
    name: "Blade dancer",
    description: "⚠️ Formula unknown - awaiting community data",
    calculateDamage: (stats, target) => {
      return 0; // Unknown formula
    }
  },

  ignite: {
    name: "Ignite",
    description: "Deals 50 damage",
    calculateDamage: (stats, target) => {
      return 50;
    }
  },

  // ========== MAGE SPELLS ==========

  blizzard: {
    name: "Blizzard/Combust/Electrocute",
    description: "Level-scaling elemental zap (see formula by level)",
    calculateDamage: (stats, target) => {
      // Level-based formulas
      const level = stats.level;
      
      if (level === 'Sam San') {
        return Math.floor(20099 + (0.19 * stats.mana));
      } else if (level === 'Ee San') {
        return Math.floor(16099 + (0.175 * stats.mana));
      } else if (level === 'Il San') {
        return Math.floor(12099 + (0.15 * stats.mana));
      } else if (level === '99' || level === 'Below 99') {
        // Using lvl 95 formula for both 99 and Below 99
        return Math.floor(8990 + (0.1 * stats.mana));
      }
      
      // Default fallback
      return Math.floor(8990 + (0.1 * stats.mana));
    }
  },

  phoenix: {
    name: "Phoenix",
    description: "1.5 x Maximum Mana",
    calculateDamage: (stats, target) => {
      return Math.floor(1.5 * stats.mana);
    }
  },

  poison_cloud: {
    name: "Poison cloud",
    description: ".125 x Maximum Mana x (Will / 100)",
    calculateDamage: (stats, target) => {
      return Math.floor(0.125 * stats.mana * (stats.will / 100));
    }
  },

  hellfire: {
    name: "Hellfire",
    description: "(4 + (.04 x Dam)) x Current Mana + DoT ticks",
    calculateDamage: (stats, target) => {
      let initial = Math.floor((4 + (0.04 * stats.dam)) * stats.mana);
      let tickDamage = Math.floor(0.25 * initial);
      let totalTicks = tickDamage * 10; // 10 ticks over 10 seconds
      
      return {
        initial: initial,
        perTick: tickDamage,
        totalTicks: totalTicks,
        grandTotal: initial + totalTicks
      };
    }
  },

  pillar_of_flames: {
    name: "Pillar of flames",
    description: ".625 x Current Mana (hits 8 targets)",
    calculateDamage: (stats, target) => {
      let perHit = Math.floor(0.625 * stats.mana);
      
      return {
        perHit: perHit,
        totalHits: perHit * 8
      };
    }
  },

  volcano: {
    name: "Volcano",
    description: "(1.625 + (.1625 x Dam)) x Current Mana (hits twice, second is half)",
    calculateDamage: (stats, target) => {
      let firstHit = Math.floor((1.625 + (0.1625 * stats.dam)) * stats.mana);
      let secondHit = Math.floor(firstHit * 0.5);
      return firstHit + secondHit;
    }
  },

  inferno: {
    name: "Inferno",
    description: "(3 + (.03 x Dam)) x Current Mana",
    calculateDamage: (stats, target) => {
      return Math.floor((3 + (0.03 * stats.dam)) * stats.mana);
    }
  },

  dooms_fire: {
    name: "Doom's fire",
    description: "(8 + (.08 x Dam)) x Current Mana (can hit twice)",
    calculateDamage: (stats, target) => {
      let firstHit = Math.floor((8 + (0.08 * stats.dam)) * stats.mana);
      let secondHit = Math.floor(firstHit * 0.5);
      
      return {
        firstHit: firstHit,
        secondHit: secondHit,
        totalBothHits: firstHit + secondHit
      };
    }
  },

  fire_breath: {
    name: "Fire breath",
    description: "2.55 x Current Mana",
    calculateDamage: (stats, target) => {
      return Math.floor(2.55 * stats.mana);
    }
  },

  twister: {
    name: "Twister",
    description: ".35 x Maximum Mana",
    calculateDamage: (stats, target) => {
      return Math.floor(0.35 * stats.mana);
    }
  },

  // ========== POET SPELLS ==========

  retribution: {
    name: "Retribution",
    description: ".34 x Current Mana (initial + .25x per tick for 6s)",
    calculateDamage: (stats, target) => {
      let initial = Math.floor(0.34 * stats.mana);
      let ticks = Math.floor(0.25 * initial * 6);
      return initial + ticks;
    }
  },

  crashing_wake: {
    name: "Crashing wake",
    description: "Based on target's vita and mana (unknown multiplier)",
    calculateDamage: (stats, target) => {
      return 0; // Unknown formula
    }
  },

  spark: {
    name: "Spark",
    description: "Scales with level, mark, and mana (multiplier unknown)",
    calculateDamage: (stats, target) => {
      return 0; // Unknown formula
    }
  },

  tornado: {
    name: "Tornado",
    description: "Destroy all enemies in a line (unknown multiplier)",
    calculateDamage: (stats, target) => {
      return 0; // Unknown formula
    }
  },

  healing_rain: {
    name: "Healing rain",
    description: "Heals allies and damages foes (unknown multiplier)",
    calculateDamage: (stats, target) => {
      return 0; // Unknown formula
    }
  },

  zen_mode: {
    name: "Zen mode",
    description: "Periodically attacks nearby enemies with Zen (unknown multiplier)",
    calculateDamage: (stats, target) => {
      return 0; // Unknown formula
    }
  }
};

// Class definitions with spells unlocked at each level tier
const CLASSES = {
  rogue: {
    name: "Rogue",
    spellsByLevel: {
      'Below 99': ['ignite', 'dagger_toss', 'desperate_attack'],
      '99': ['lethal_strike', 'bomb_barrage'],
      'Il San': [],
      'Ee San': ['bladestorm'],
      'Sam San': ['focused_blow', 'blade_dancer']
    }
  },
  warrior: {
    name: "Warrior",
    spellsByLevel: {
      'Below 99': ['dragons_fist', 'devastating_blow'],
      '99': ['berserk', 'whirlwind'],
      'Il San': ['battle_storm'],
      'Ee San': ['assault', 'dragons_convulsion'],
      'Sam San': ['siege']
    }
  },
  mage: {
    name: "Mage",
    spellsByLevel: {
      'Below 99': ['blizzard', 'phoenix', 'poison_cloud', 'twister'],
      '99': ['hellfire'],
      'Il San': ['pillar_of_flames', 'volcano'],
      'Ee San': ['inferno'],
      'Sam San': ['dooms_fire', 'fire_breath']
    }
  },
  poet: {
    name: "Poet",
    spellsByLevel: {
      'Below 99': ['crashing_wake', 'healing_rain'],
      '99': ['retribution', 'tornado'],
      'Il San': [],
      'Ee San': [],
      'Sam San': ['zen_mode']
    }
  }
};

// Level tiers in order of obtainment
const LEVEL_TIERS = ['Below 99', '99', 'Il San', 'Ee San', 'Sam San'];

// Helper function to get all spells available at a given level
// Includes all spells from current and previous level tiers
function getSpellsForLevel(className, levelTier) {
  const classData = CLASSES[className];
  if (!classData) return [];
  
  const levelIndex = LEVEL_TIERS.indexOf(levelTier);
  if (levelIndex === -1) return [];
  
  let availableSpells = [];
  for (let i = 0; i <= levelIndex; i++) {
    const tierSpells = classData.spellsByLevel[LEVEL_TIERS[i]];
    if (tierSpells) {
      availableSpells = availableSpells.concat(tierSpells);
    }
  }
  
  return availableSpells;
}

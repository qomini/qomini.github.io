// Main damage calculation engine
class DamageCalculator {
  constructor(characterStats, targetStats) {
    this.character = characterStats;
    this.target = targetStats;
  }

  // Calculate damage for a specific spell
  calculateSpellDamage(spellId) {
    const spell = SPELLS[spellId];
    if (!spell || !spell.calculateDamage) {
      console.warn(`Spell ${spellId} not found or has no damage calculation`);
      return 0;
    }
    
    try {
      const result = spell.calculateDamage(this.character, this.target);
      // Handle both simple numbers and complex damage objects
      return result;
    } catch (error) {
      console.error(`Error calculating damage for ${spellId}:`, error);
      return 0;
    }
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
  }

  updateTarget(newStats) {
    this.target = { ...this.target, ...newStats };
  }
}

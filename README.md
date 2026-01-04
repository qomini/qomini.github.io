# OTK Damage Calculator

A web-based damage calculator for Original The Kingdom (OTK). Calculate spell damage for all classes based on your character's stats, buffs, debuffs, and target AC.

🔗 **Live Site:** [https://qomini.github.io](https://qomini.github.io)

## Features

- **4 Classes:** Warrior, Rogue, Mage, Poet
- **Real Game Formulas:** Damage calculations pulled directly from [originaltk.com](https://originaltk.com/spells/index-with-search.php)
- **Level-Based Scaling:** Formulas adjust based on level tier (Below 99, 99, Il San, Ee San, Sam San)
- **Multi-Hit Breakdowns:** See detailed damage for spells with multiple hits or DoT ticks
- **AC System:** Accurate Armor Class mechanics (positive AC increases damage, negative AC decreases damage)
- **Buffs & Debuffs:** Comprehensive buff/debuff system with mutual exclusivity support
- **Dark Mode:** Toggle between light and dark themes
- **Persistent Inputs:** Your stats are saved locally and restored on next visit
- **Responsive Design:** Works on desktop, tablet, and mobile
- **Easy Input:** Comma formatting for large numbers (Vita/Mana)

## Usage

1. **Choose Mode:** Select PvE (PvP coming soon)
2. **Character Stats:** 
   - Select your **Class** and **Level**
   - Enter your character's stats (Vita, Mana, Dam, Hit, Might, Will, Grace)
   - Expand **Buffs** section to select active buffs
3. **Target Stats:**
   - Enter target stats (AC, Vita, Mana)
   - Expand **Debuffs** section to select active debuffs
4. Click **Calculate Damage** to see all available spells and their damage

## Buffs & Debuffs

### Warrior Buffs (Self-cast only)
- **Bless** - +5 Hit (mutually exclusive with Greater blessing)
- **Potence** - +5 Dam (mutually exclusive with Greater potence)
- **Greater blessing** - +10 Hit (mutually exclusive with Bless)
- **Greater potence** - +10 Dam (mutually exclusive with Potence)
- **Limit breaker** - Doubles damage (2x multiplier)

### Rogue Debuffs
- **Corrode armor** - +8 AC (PvE) / +10 AC (PvP) - mutually exclusive with Dissolve armor
- **Dissolve armor** - +10 AC (PvE) / +15 AC (PvP) - mutually exclusive with Corrode armor
- **Sleep Dart** - 1.5x damage (PvE) / 1.1x (PvP) / 1.2x (PvE Boss)

### Mage Buffs & Debuffs
- **Arcane Power** (Self-cast) - +5 to +25 Dam (scales with level: +5 per tier)
- **Corrupted Armor/Vex** (Debuff) - +15 AC - mutually exclusive with Scourge
- **Doze/Trance** (Debuff) - 1.3x damage taken

### Poet Buffs & Debuffs
- **Angel's blessing** (Buff) - +7 Might, +6 Will, +5 Grace
- **Empower** (Buff) - +20% damage
- **Zen mode** (Buff, Self-cast) - +10% max mana, +20 Will, +20 Dam
- **Scourge** (Debuff) - +35 AC (PvE) / +50 AC (PvP) - mutually exclusive with Corrupted Armor/Vex
- **Angel's blessing (Protection)** (Debuff) - 45% damage reduction (target takes 55% damage)

## Damage Calculation Order

The calculator applies modifiers in this specific order:

1. **Base Spell Damage Calculation**
   - Uses character's effective stats (base stats + buff bonuses)
   - Applies spell formula from game data

2. **Apply Damage Multipliers**
   - Buff multipliers (Empower 1.2x, Limit Breaker 2x, etc.)
   - Debuff multipliers (Doze/Trance 1.3x, Sleep Dart 1.5x, Angel's blessing Protection 0.55x, etc.)
   - Combined: `baseDamage × buffMultiplier × debuffMultiplier`

3. **Apply AC Modifier (Final Step)**
   - Takes the multiplied damage from step 2
   - Applies formula: `finalDamage = multipliedDamage × (1 + AC/100)`
   - AC is clamped to game limits:
     - Technical range: -127 to +100
     - Effective range: -80 to +100 (AC below -80 has no additional effect)
   - Positive AC increases damage, negative AC decreases damage

### Example Calculation:
```
Spell base damage: 1000
+ Empower buff (1.2x): 1200
+ Doze/Trance debuff (1.3x): 1560
+ Target AC +50: 1560 × 1.5 = 2340 final damage
```

## AC (Armor Class) System

- **Positive AC** = Target takes MORE damage (e.g., +50 AC = 50% more damage)
- **Negative AC** = Target takes LESS damage (e.g., -50 AC = 50% less damage)
- **Range:** -127 to +100 (technical), -80 to +100 (effective)
- AC modifiers from debuffs (Scourge, Corrode armor, etc.) are added to base target AC before final calculation

## Tech Stack

- Pure HTML/CSS/JavaScript (no frameworks)
- Static site hosted on GitHub Pages
- Modular architecture:
  - `js/data/classes.js` - Class and spell tier definitions
  - `js/data/spells.js` - Spell formulas
  - `js/data/effects.js` - Buffs and debuffs
  - `js/calculator.js` - Damage calculation engine
  - `js/main.js` - UI logic and event handlers
  - `css/styles.css` - Styling with CSS variables for theming

## Contributing

Found an incorrect formula or have a new spell/buff/debuff to add? Feel free to open an issue or submit a pull request!

## Note

Some spells show "???" for damage - these formulas are currently unknown. If you know the correct formula, please contribute!
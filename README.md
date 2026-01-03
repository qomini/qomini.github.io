# OTK Damage Calculator

A web-based damage calculator for OTK. Calculate spell damage for all classes based on your character's stats.

🔗 **Live Site:** [https://qomini.github.io](https://qomini.github.io)

## Features

- **4 Classes:** Warrior, Rogue, Mage, Poet
- **Real Game Formulas:** Damage calculations pulled directly from [originaltk.com](https://originaltk.com/spells/index-with-search.php)
- **Level-Based Scaling:** Formulas adjust based on level tier (Below 99, 99, Il San, Ee San, Sam San)
- **Multi-Hit Breakdowns:** See detailed damage for spells with multiple hits or DoT ticks
- **Responsive Design:** Works on desktop, tablet, and mobile
- **Easy Input:** Comma formatting for large numbers (Vita/Mana)

## Usage

1. Select your **Class** and **Level**
2. Enter your character's stats (Vita, Mana, Dam, Hit, Might, Will, Grace)
3. Enter target stats (AC, Vita, Mana)
4. Click **Calculate Damage** to see all available spells and their damage

## Tech Stack

- Pure HTML/CSS/JavaScript (no frameworks)
- Static site hosted on GitHub Pages
- Modular architecture for easy spell/class additions

## Contributing

Found an incorrect formula or have a new spell to add? Feel free to open an issue or submit a pull request!

## Note

Some spells show "???" for damage - these formulas are currently unknown. If you know the correct formula, please contribute!
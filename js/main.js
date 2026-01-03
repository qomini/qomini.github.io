// Main UI logic and event handlers
let calculator = null;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeForm();
  setupEventListeners();
  setupNumberFormatting();
});

// Initialize form with default values and populate dropdowns
function initializeForm() {
  // Populate class dropdown
  const classSelect = document.getElementById('class');
  Object.keys(CLASSES).forEach(classKey => {
    const option = document.createElement('option');
    option.value = classKey;
    option.textContent = CLASSES[classKey].name;
    classSelect.appendChild(option);
  });

  // Populate level dropdown
  const levelSelect = document.getElementById('level');
  LEVEL_TIERS.forEach(tier => {
    const option = document.createElement('option');
    option.value = tier;
    option.textContent = tier;
    levelSelect.appendChild(option);
  });
}

// Setup number formatting for large number fields
function setupNumberFormatting() {
  const largeNumberFields = ['vita', 'mana', 'targetVita', 'targetMana'];
  
  largeNumberFields.forEach(fieldId => {
    const input = document.getElementById(fieldId);
    
    // Format on blur (when user clicks away)
    input.addEventListener('blur', function() {
      if (this.value) {
        const num = parseInt(this.value.replace(/,/g, ''));
        if (!isNaN(num)) {
          this.value = num.toLocaleString();
        }
      }
    });
    
    // Remove formatting on focus (when user clicks to edit)
    input.addEventListener('focus', function() {
      if (this.value) {
        this.value = this.value.replace(/,/g, '');
      }
    });
  });
}

// Setup all event listeners
function setupEventListeners() {
  const calculateBtn = document.getElementById('calculateBtn');
  calculateBtn.addEventListener('click', handleCalculate);

  // Optional: Calculate on input change
  const form = document.getElementById('statsForm');
  form.addEventListener('change', handleCalculate);
}

// Handle calculate button click
function handleCalculate() {
  // Get character stats from form (strip commas from large numbers)
  const characterStats = {
    vita: parseInt(document.getElementById('vita').value.replace(/,/g, '')) || 0,
    mana: parseInt(document.getElementById('mana').value.replace(/,/g, '')) || 0,
    dam: parseInt(document.getElementById('dam').value) || 0,
    hit: parseInt(document.getElementById('hit').value) || 0,
    might: parseInt(document.getElementById('might').value) || 0,
    will: parseInt(document.getElementById('will').value) || 0,
    grace: parseInt(document.getElementById('grace').value) || 0,
    class: document.getElementById('class').value,
    level: document.getElementById('level').value
  };

  // Get target stats from form (strip commas from large numbers)
  const targetStats = {
    ac: parseInt(document.getElementById('targetAC').value) || 0,
    vita: parseInt(document.getElementById('targetVita').value.replace(/,/g, '')) || 0,
    mana: parseInt(document.getElementById('targetMana').value.replace(/,/g, '')) || 0
  };

  // Validate inputs
  if (!characterStats.class || !characterStats.level) {
    displayError('Please select both Class and Level');
    return;
  }

  // Create or update calculator
  if (!calculator) {
    calculator = new DamageCalculator(characterStats, targetStats);
  } else {
    calculator.updateCharacter(characterStats);
    calculator.updateTarget(targetStats);
  }

  // Calculate and display results
  displayResults(calculator.getAvailableSpells());
}

// Display spell damage results
function displayResults(spells) {
  const resultsDiv = document.getElementById('results');
  
  if (!spells || spells.length === 0) {
    resultsDiv.innerHTML = '<p class="no-spells">No spells available for this class/level combination.</p>';
    return;
  }

  let html = '<div class="spells-grid">';
  
  spells.forEach(spell => {
    const damageDisplay = formatDamageDisplay(spell.damage);
    
    html += `
      <div class="spell-card">
        <h3 class="spell-name">${spell.name}</h3>
        <p class="spell-description">${spell.description}</p>
        ${damageDisplay}
      </div>
    `;
  });
  
  html += '</div>';
  resultsDiv.innerHTML = html;
}

// Format damage display - handles both simple numbers and complex objects
function formatDamageDisplay(damage) {
  // Handle objects with multiple damage values
  if (typeof damage === 'object' && damage !== null) {
    let html = '<div class="spell-damage-multi">';
    
    // Hellfire pattern (initial + ticks)
    if (damage.initial !== undefined && damage.perTick !== undefined) {
      html += `
        <div class="damage-row">
          <span class="damage-label">Initial Hit:</span>
          <span class="damage-value">${damage.initial.toLocaleString()}</span>
        </div>
        <div class="damage-row">
          <span class="damage-label">Per Tick (x10):</span>
          <span class="damage-value-small">${damage.perTick.toLocaleString()}</span>
        </div>
        <div class="damage-row damage-row-total">
          <span class="damage-label">Total Damage:</span>
          <span class="damage-value-total">${damage.grandTotal.toLocaleString()}</span>
        </div>
      `;
    }
    // Pillar of flames pattern (per hit x8)
    else if (damage.perHit !== undefined && damage.totalHits !== undefined) {
      html += `
        <div class="damage-row">
          <span class="damage-label">Per Hit:</span>
          <span class="damage-value">${damage.perHit.toLocaleString()}</span>
        </div>
        <div class="damage-row damage-row-total">
          <span class="damage-label">Total (8 hits):</span>
          <span class="damage-value-total">${damage.totalHits.toLocaleString()}</span>
        </div>
      `;
    }
    // Doom's fire pattern (first + second hit)
    else if (damage.firstHit !== undefined && damage.secondHit !== undefined) {
      html += `
        <div class="damage-row">
          <span class="damage-label">First Hit:</span>
          <span class="damage-value">${damage.firstHit.toLocaleString()}</span>
        </div>
        <div class="damage-row">
          <span class="damage-label">Second Hit (50%):</span>
          <span class="damage-value-small">${damage.secondHit.toLocaleString()}</span>
        </div>
        <div class="damage-row damage-row-total">
          <span class="damage-label">Total (both hits):</span>
          <span class="damage-value-total">${damage.totalBothHits.toLocaleString()}</span>
        </div>
      `;
    }
    
    html += '</div>';
    return html;
  }
  
  // Simple number damage (or 0 for unknown formulas)
  const displayValue = damage === 0 ? '???' : damage.toLocaleString();
  const warningClass = damage === 0 ? ' damage-unknown' : '';
  
  return `
    <div class="spell-damage">
      <span class="damage-label">Damage:</span>
      <span class="damage-value${warningClass}">${displayValue}</span>
    </div>
  `;
}

// Display error message
function displayError(message) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = `<p class="error">${message}</p>`;
}

// Format large numbers with commas
function formatNumber(num) {
  return num.toLocaleString();
}

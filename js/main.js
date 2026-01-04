// Main UI logic and event handlers
let calculator = null;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeTheme();
  initializeForm();
  loadSavedInputs();
  setupEventListeners();
  setupNumberFormatting();
  setupInputSaving();
  setupCollapsibleSections();
  setupGameModeToggle();
  populateBuffs();
  populateDebuffs();
});

// Initialize theme from localStorage
function initializeTheme() {
  const savedTheme = localStorage.getItem('otkTheme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    updateThemeIcon();
  }
}

// Toggle dark mode
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('otkTheme', isDark ? 'dark' : 'light');
  updateThemeIcon();
}

// Update theme icon
function updateThemeIcon() {
  const themeIcon = document.querySelector('.theme-icon');
  const isDark = document.body.classList.contains('dark-mode');
  themeIcon.textContent = isDark ? '☀️' : '🌙';
}

// Load saved inputs from localStorage
function loadSavedInputs() {
  const savedData = localStorage.getItem('otkCalcInputs');
  if (savedData) {
    try {
      const inputs = JSON.parse(savedData);
      
      // Load all input fields
      Object.keys(inputs).forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element && inputs[fieldId] !== undefined) {
          if (element.type === 'checkbox') {
            element.checked = inputs[fieldId];
          } else {
            element.value = inputs[fieldId];
          }
        }
      });
    } catch (e) {
      console.error('Error loading saved inputs:', e);
    }
  }
}

// Save inputs to localStorage
function saveInputs() {
  const inputFields = [
    'class', 'level', 'vita', 'mana', 'dam', 'hit', 
    'might', 'will', 'grace', 'targetAC', 'targetVita', 'targetMana'
  ];
  
  const inputs = {};
  inputFields.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      inputs[fieldId] = element.value;
    }
  });
  
  // Save checkbox states
  const isBossCheckbox = document.getElementById('isBoss');
  if (isBossCheckbox) {
    inputs.isBoss = isBossCheckbox.checked;
  }
  
  localStorage.setItem('otkCalcInputs', JSON.stringify(inputs));
}

// Setup input saving on change
function setupInputSaving() {
  const form = document.getElementById('statsForm');
  const inputs = form.querySelectorAll('input, select');
  
  inputs.forEach(input => {
    input.addEventListener('change', saveInputs);
    // Also save on input for text fields (real-time saving)
    if (input.type === 'text' || input.type === 'number') {
      input.addEventListener('input', debounce(saveInputs, 500));
    }
  });
}

// Debounce function to limit how often saveInputs is called
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

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

  // Theme toggle button
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', toggleTheme);

  // Class change updates available buffs
  const classSelect = document.getElementById('class');
  classSelect.addEventListener('change', updateBuffsForClass);

  // Optional: Calculate on input change
  const form = document.getElementById('statsForm');
  form.addEventListener('change', handleCalculate);
}

// Handle calculate button click
function handleCalculate() {
  // Get game mode and boss status
  const gameMode = document.querySelector('input[name="gameMode"]:checked')?.value || 'pve';
  const isBoss = document.getElementById('isBoss')?.checked || false;

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
    mana: parseInt(document.getElementById('targetMana').value.replace(/,/g, '')) || 0,
    isBoss: isBoss
  };

  // Get selected buffs and debuffs
  const selectedBuffs = getSelectedBuffs();
  const selectedDebuffs = getSelectedDebuffs();

  // Validate inputs
  if (!characterStats.class || !characterStats.level) {
    displayError('Please select both Class and Level');
    return;
  }

  // Create or update calculator
  if (!calculator) {
    calculator = new DamageCalculator(characterStats, targetStats, selectedBuffs, selectedDebuffs, gameMode);
  } else {
    calculator.gameMode = gameMode;
    calculator.updateCharacter(characterStats);
    calculator.updateTarget(targetStats);
    calculator.updateBuffs(selectedBuffs);
    calculator.updateDebuffs(selectedDebuffs);
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

// Setup collapsible sections
function setupCollapsibleSections() {
  const toggleButtons = document.querySelectorAll('.section-toggle');
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetId = this.dataset.target;
      const content = document.getElementById(targetId);
      
      if (content) {
        content.classList.toggle('collapsed');
        this.classList.toggle('collapsed');
      }
    });
  });
}

// Setup game mode toggle (PvE/PvP)
function setupGameModeToggle() {
  const gameModeRadios = document.querySelectorAll('input[name="gameMode"]');
  
  gameModeRadios.forEach(radio => {
    radio.addEventListener('change', updateBossToggleVisibility);
  });
  
  // Set initial visibility
  updateBossToggleVisibility();
}

// Update boss toggle visibility based on game mode
function updateBossToggleVisibility() {
  const isPvE = document.querySelector('input[name="gameMode"]:checked')?.value === 'pve';
  const bossToggleRow = document.getElementById('bossToggleRow');
  
  if (bossToggleRow) {
    bossToggleRow.style.display = isPvE ? 'grid' : 'none';
  }
}

// Populate buffs section
function populateBuffs() {
  const buffsGrid = document.getElementById('buffsGrid');
  const currentClass = document.getElementById('class').value;
  
  let html = '';
  
  Object.keys(BUFFS).forEach(buffId => {
    const buff = BUFFS[buffId];
    const isApplicable = buff.applicableClasses.includes(currentClass);
    
    // Hide self-only buffs if not applicable to current class
    if (buff.selfOnly && !isApplicable) {
      return; // Skip this buff entirely
    }
    
    let restrictionText = '';
    if (buff.selfOnly) {
      restrictionText = `<div class="effect-restriction">(Self-cast only)</div>`;
    } else if (buff.applicableClasses.length < 4) {
      restrictionText = `<div class="effect-restriction">(Cast by: ${buff.applicableClasses.map(c => CLASSES[c].name).join(', ')})</div>`;
    }
    
    html += `
      <label class="effect-option" data-effect-id="${buffId}">
        <input type="checkbox" name="buff" value="${buffId}" onchange="handleBuffDebuffChange(this, 'buff')">
        <div class="effect-info">
          <div class="effect-name">${buff.name}</div>
          <div class="effect-description">${buff.description}</div>
          ${restrictionText}
        </div>
      </label>
    `;
  });
  
  buffsGrid.innerHTML = html || '<p class="no-effects">No buffs available</p>';
}

// Populate debuffs section
function populateDebuffs() {
  const debuffsGrid = document.getElementById('debuffsGrid');
  
  let html = '';
  
  Object.keys(DEBUFFS).forEach(debuffId => {
    const debuff = DEBUFFS[debuffId];
    
    html += `
      <label class="effect-option" data-effect-id="${debuffId}">
        <input type="checkbox" name="debuff" value="${debuffId}" onchange="handleBuffDebuffChange(this, 'debuff')">
        <div class="effect-info">
          <div class="effect-name">${debuff.name}</div>
          <div class="effect-description">${debuff.description}</div>
        </div>
      </label>
    `;
  });
  
  debuffsGrid.innerHTML = html;
}

// Handle buff/debuff checkbox changes with mutual exclusivity
function handleBuffDebuffChange(checkbox, type) {
  if (!checkbox.checked) return;
  
  const effectId = checkbox.value;
  const effectData = type === 'buff' ? BUFFS[effectId] : DEBUFFS[effectId];
  
  if (effectData && effectData.mutuallyExclusive) {
    // Uncheck mutually exclusive effects
    effectData.mutuallyExclusive.forEach(excludedId => {
      const excludedCheckbox = document.querySelector(`input[name="${type}"][value="${excludedId}"]`);
      if (excludedCheckbox) {
        excludedCheckbox.checked = false;
      }
    });
  }
}

// Update buffs when class changes
function updateBuffsForClass() {
  populateBuffs();
}

// Get selected buffs
function getSelectedBuffs() {
  const checkboxes = document.querySelectorAll('input[name="buff"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

// Get selected debuffs
function getSelectedDebuffs() {
  const checkboxes = document.querySelectorAll('input[name="debuff"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

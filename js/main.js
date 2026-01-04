// Main UI logic and event handlers
let calculator = null;
let currentScenario = 'before'; // Track current scenario: 'before' or 'after'
let scenarioData = {
  before: {},
  after: {}
};

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
  setupComparisonMode();
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

  // Check if comparison mode is enabled
  const isComparisonMode = document.querySelector('input[name="comparisonMode"]:checked')?.value === 'on';
  
  if (isComparisonMode) {
    // Save current form to current scenario
    saveCurrentFormToScenario(currentScenario);
    
    // Calculate both scenarios
    calculateComparison(gameMode);
  } else {
    // Normal single calculation
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
}

// Calculate and display comparison
function calculateComparison(gameMode) {
  const resultsDiv = document.getElementById('results');
  
  // Build stats for both scenarios
  const beforeStats = buildStatsFromScenario('before');
  const afterStats = buildStatsFromScenario('after');
  
  // Validate
  if (!beforeStats.character.class || !beforeStats.character.level) {
    displayError('Please select Class and Level for "Before" scenario');
    return;
  }
  if (!afterStats.character.class || !afterStats.character.level) {
    displayError('Please select Class and Level for "After" scenario');
    return;
  }
  
  // Calculate both
  const beforeCalc = new DamageCalculator(
    beforeStats.character, 
    beforeStats.target, 
    beforeStats.buffs, 
    beforeStats.debuffs, 
    gameMode
  );
  const afterCalc = new DamageCalculator(
    afterStats.character, 
    afterStats.target, 
    afterStats.buffs, 
    afterStats.debuffs, 
    gameMode
  );
  
  const beforeSpells = beforeCalc.getAvailableSpells();
  const afterSpells = afterCalc.getAvailableSpells();
  
  // Display comparison
  displayComparisonResults(beforeSpells, afterSpells);
}

// Build stats object from scenario data
function buildStatsFromScenario(scenario) {
  const data = scenarioData[scenario];
  
  return {
    character: {
      vita: parseInt(data.vita?.replace(/,/g, '')) || 0,
      mana: parseInt(data.mana?.replace(/,/g, '')) || 0,
      dam: parseInt(data.dam) || 0,
      hit: parseInt(data.hit) || 0,
      might: parseInt(data.might) || 0,
      will: parseInt(data.will) || 0,
      grace: parseInt(data.grace) || 0,
      class: data.class,
      level: data.level
    },
    target: {
      ac: parseInt(data.targetAC) || 0,
      vita: parseInt(data.targetVita?.replace(/,/g, '')) || 0,
      mana: parseInt(data.targetMana?.replace(/,/g, '')) || 0,
      isBoss: data.isBoss || false
    },
    buffs: data.buffs || [],
    debuffs: data.debuffs || []
  };
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

// Display comparison results
function displayComparisonResults(beforeSpells, afterSpells) {
  const resultsDiv = document.getElementById('results');
  
  if (!beforeSpells || beforeSpells.length === 0) {
    resultsDiv.innerHTML = '<p class="no-spells">No spells available for "Before" scenario.</p>';
    return;
  }
  
  // Create a map of after spells for quick lookup
  const afterSpellsMap = new Map();
  afterSpells.forEach(spell => {
    afterSpellsMap.set(spell.id, spell);
  });
  
  let html = '<div class="spells-grid comparison-grid">';
  
  beforeSpells.forEach(beforeSpell => {
    const afterSpell = afterSpellsMap.get(beforeSpell.id);
    
    // If spell doesn't exist in after scenario, skip it
    if (!afterSpell) {
      html += `
        <div class="spell-card comparison-card">
          <h3 class="spell-name">${beforeSpell.name}</h3>
          <p class="spell-description">${beforeSpell.description}</p>
          <div class="comparison-unavailable">Not available in "After" scenario</div>
        </div>
      `;
      return;
    }
    
    const comparisonDisplay = formatComparisonDisplay(beforeSpell, afterSpell);
    
    html += `
      <div class="spell-card comparison-card">
        <h3 class="spell-name">${beforeSpell.name}</h3>
        <p class="spell-description">${beforeSpell.description}</p>
        ${comparisonDisplay}
      </div>
    `;
  });
  
  html += '</div>';
  resultsDiv.innerHTML = html;
}

// Format comparison display for a spell
function formatComparisonDisplay(beforeSpell, afterSpell) {
  const beforeDamage = beforeSpell.damage;
  const afterDamage = afterSpell.damage;
  
  // Handle complex damage objects (multi-hit, DoT, etc.)
  if (typeof beforeDamage === 'object' && beforeDamage !== null) {
    return formatComplexComparison(beforeDamage, afterDamage);
  }
  
  // Simple damage comparison
  return formatSimpleComparison(beforeDamage, afterDamage);
}

// Format simple damage comparison
function formatSimpleComparison(beforeDmg, afterDmg) {
  if (beforeDmg === 0 || afterDmg === 0) {
    return `
      <div class="spell-damage">
        <span class="damage-label">Damage:</span>
        <span class="damage-value damage-unknown">???</span>
      </div>
    `;
  }
  
  const delta = afterDmg - beforeDmg;
  const percentChange = beforeDmg > 0 ? ((delta / beforeDmg) * 100) : 0;
  const deltaClass = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '=';
  
  return `
    <div class="comparison-damage">
      <div class="damage-row-comparison">
        <span class="damage-label">Before:</span>
        <span class="damage-value">${beforeDmg.toLocaleString()}</span>
      </div>
      <div class="damage-row-comparison">
        <span class="damage-label">After:</span>
        <span class="damage-value">${afterDmg.toLocaleString()}</span>
      </div>
      <div class="damage-row-comparison damage-delta ${deltaClass}">
        <span class="damage-label">Δ</span>
        <span class="damage-value-delta">
          ${delta >= 0 ? '+' : ''}${delta.toLocaleString()} 
          (${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%) 
          ${arrow}
        </span>
      </div>
    </div>
  `;
}

// Format complex damage comparison (multi-hit, DoT, etc.)
function formatComplexComparison(beforeDmg, afterDmg) {
  // Find the "total" damage field
  let beforeTotal = beforeDmg.grandTotal || beforeDmg.totalHits || beforeDmg.totalBothHits || 0;
  let afterTotal = afterDmg.grandTotal || afterDmg.totalHits || afterDmg.totalBothHits || 0;
  
  if (beforeTotal === 0 && afterTotal === 0) {
    // No clear total, just show before/after without delta
    return `
      <div class="comparison-damage">
        <div class="damage-label">Before:</div>
        ${formatDamageDisplay(beforeDmg)}
        <div class="damage-label" style="margin-top: 10px;">After:</div>
        ${formatDamageDisplay(afterDmg)}
      </div>
    `;
  }
  
  const delta = afterTotal - beforeTotal;
  const percentChange = beforeTotal > 0 ? ((delta / beforeTotal) * 100) : 0;
  const deltaClass = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '=';
  
  return `
    <div class="comparison-damage">
      <div class="damage-row-comparison">
        <span class="damage-label">Before Total:</span>
        <span class="damage-value">${beforeTotal.toLocaleString()}</span>
      </div>
      <div class="damage-row-comparison">
        <span class="damage-label">After Total:</span>
        <span class="damage-value">${afterTotal.toLocaleString()}</span>
      </div>
      <div class="damage-row-comparison damage-delta ${deltaClass}">
        <span class="damage-label">Δ</span>
        <span class="damage-value-delta">
          ${delta >= 0 ? '+' : ''}${delta.toLocaleString()} 
          (${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%) 
          ${arrow}
        </span>
      </div>
    </div>
  `;
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

// Setup comparison mode
function setupComparisonMode() {
  const comparisonRadios = document.querySelectorAll('input[name="comparisonMode"]');
  
  comparisonRadios.forEach(radio => {
    radio.addEventListener('change', handleComparisonModeChange);
  });
  
  // Setup scenario tab switching
  const scenarioTabs = document.querySelectorAll('.scenario-tab');
  scenarioTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      switchScenario(this.dataset.scenario);
    });
  });
}

// Handle comparison mode toggle
function handleComparisonModeChange() {
  const isComparisonMode = document.querySelector('input[name="comparisonMode"]:checked')?.value === 'on';
  const scenarioTabsSection = document.getElementById('scenarioTabs');
  
  if (isComparisonMode) {
    // Save current form state to 'before' scenario
    saveCurrentFormToScenario('before');
    
    // Show scenario tabs
    scenarioTabsSection.style.display = 'flex';
    
    // Switch to 'before' tab
    switchScenario('before');
  } else {
    // Hide scenario tabs
    scenarioTabsSection.style.display = 'none';
    
    // Restore 'before' scenario to form (if it exists)
    if (Object.keys(scenarioData.before).length > 0) {
      loadScenarioToForm('before');
    }
  }
  
  // Recalculate
  handleCalculate();
}

// Switch between before/after scenarios
function switchScenario(scenario) {
  // Save current form state to current scenario
  saveCurrentFormToScenario(currentScenario);
  
  // Update current scenario
  currentScenario = scenario;
  
  // Update tab UI
  document.querySelectorAll('.scenario-tab').forEach(tab => {
    if (tab.dataset.scenario === scenario) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  // Load new scenario to form
  loadScenarioToForm(scenario);
}

// Save current form state to a scenario
function saveCurrentFormToScenario(scenario) {
  const formData = {
    // Character stats
    class: document.getElementById('class').value,
    level: document.getElementById('level').value,
    vita: document.getElementById('vita').value,
    mana: document.getElementById('mana').value,
    dam: document.getElementById('dam').value,
    hit: document.getElementById('hit').value,
    might: document.getElementById('might').value,
    will: document.getElementById('will').value,
    grace: document.getElementById('grace').value,
    
    // Target stats
    targetAC: document.getElementById('targetAC').value,
    targetVita: document.getElementById('targetVita').value,
    targetMana: document.getElementById('targetMana').value,
    isBoss: document.getElementById('isBoss')?.checked || false,
    
    // Buffs and debuffs
    buffs: getSelectedBuffs(),
    debuffs: getSelectedDebuffs()
  };
  
  scenarioData[scenario] = formData;
}

// Load a scenario to the form
function loadScenarioToForm(scenario) {
  const data = scenarioData[scenario];
  
  // If no data for this scenario, initialize with current form values
  if (!data || Object.keys(data).length === 0) {
    saveCurrentFormToScenario(scenario);
    return;
  }
  
  // Load character stats
  document.getElementById('class').value = data.class || '';
  document.getElementById('level').value = data.level || '';
  document.getElementById('vita').value = data.vita || '';
  document.getElementById('mana').value = data.mana || '';
  document.getElementById('dam').value = data.dam || '';
  document.getElementById('hit').value = data.hit || '';
  document.getElementById('might').value = data.might || '';
  document.getElementById('will').value = data.will || '';
  document.getElementById('grace').value = data.grace || '';
  
  // Load target stats
  document.getElementById('targetAC').value = data.targetAC || '';
  document.getElementById('targetVita').value = data.targetVita || '';
  document.getElementById('targetMana').value = data.targetMana || '';
  if (document.getElementById('isBoss')) {
    document.getElementById('isBoss').checked = data.isBoss || false;
  }
  
  // Load buffs
  document.querySelectorAll('input[name="buff"]').forEach(checkbox => {
    checkbox.checked = data.buffs?.includes(checkbox.value) || false;
  });
  
  // Load debuffs
  document.querySelectorAll('input[name="debuff"]').forEach(checkbox => {
    checkbox.checked = data.debuffs?.includes(checkbox.value) || false;
  });
  
  // Update buffs display if class changed
  populateBuffs();
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

/* ============================================================
   FLAKMES – app.js
   ============================================================ */

'use strict';

// ── Constants ──────────────────────────────────────────────
const FLAKMES = ['F', 'L', 'A', 'K', 'M', 'E', 'S'];
const LABELS  = {
  F: 'Friends',
  L: 'Love',
  A: 'Affair',
  K: 'Kiss',
  M: 'Marry',
  E: 'Enemy',
  S: 'Sweetheart',
};
const DESCRIPTIONS = {
  F: 'You two are great friends! Treasure this bond.',
  L: 'There\'s love in the air between you two! 💕',
  A: 'Sparks fly! There\'s definitely an affair brewing.',
  K: 'You two just can\'t resist stealing a kiss! 😘',
  M: 'You are meant to be together forever! Marriage is in your stars! 💍',
  E: 'Watch out — you two might be fierce rivals! 😤',
  S: 'Sweethearts through and through! Pure and precious. 🌸',
};
const COLORS = {
  F: '#40c4ff',
  L: '#ff4081',
  A: '#ff9100',
  K: '#ec407a',
  M: '#ffd740',
  E: '#ff5252',
  S: '#69f0ae',
};
const PARTICLE_SYMBOLS  = ['❤️', '💕', '✨', '💫', '🌟', '💖', '💗', '🌸'];
const HISTORY_KEY       = 'flakmes_history';
const MAX_HISTORY       = 10;
const ANIM_LETTER_DELAY = 120; // ms between each letter reveal
const MATCH_REVEAL_DELAY = 80; // ms between each match highlight

// ── DOM References ─────────────────────────────────────────
const form           = document.getElementById('game-form');
const name1Input     = document.getElementById('name1');
const name2Input     = document.getElementById('name2');
const err1           = document.getElementById('err1');
const err2           = document.getElementById('err2');
const playBtn        = document.getElementById('play-btn');
const playAgainBtn   = document.getElementById('play-again-btn');
const animSection    = document.getElementById('anim-section');
const rowName1       = document.getElementById('row-name1');
const rowName2       = document.getElementById('row-name2');
const countWrap      = document.getElementById('count-wrap');
const matchCountDisp = document.getElementById('match-count-display');
const resultSection  = document.getElementById('result-section');
const resName1       = document.getElementById('res-name1');
const resName2       = document.getElementById('res-name2');
const resultBadge    = document.getElementById('result-badge');
const resultLetter   = document.getElementById('result-letter');
const resultWord     = document.getElementById('result-word');
const resultDesc     = document.getElementById('result-desc');
const historyList    = document.getElementById('history-list');
const clearHistBtn   = document.getElementById('clear-history-btn');
const marryOverlay   = document.getElementById('marry-overlay');
const enemyOverlay   = document.getElementById('enemy-overlay');
const fireworksCont  = document.getElementById('fireworks');
const lightningCont  = document.getElementById('lightning');
const partCont       = document.getElementById('particles-container');

// ── Helpers ────────────────────────────────────────────────

/**
 * Convert a name to lowercase letters only (no spaces/punctuation).
 * Returns original-cased display string and letter-only string.
 */
function prepareName(name) {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

/**
 * Build frequency map for letters in a string.
 */
function freqMap(str) {
  const map = {};
  for (const ch of str) {
    map[ch] = (map[ch] || 0) + 1;
  }
  return map;
}

/**
 * Core algorithm: count matching letters between two names.
 * For each letter present in both names, adds min(freq1, freq2) to total.
 */
function countMatches(name1, name2) {
  const letters1 = prepareName(name1);
  const letters2 = prepareName(name2);
  const freq1 = freqMap(letters1);
  const freq2 = freqMap(letters2);
  let count = 0;
  const matched = [];  // list of matched letters for animation info
  for (const ch of Object.keys(freq1)) {
    if (freq2[ch]) {
      const n = Math.min(freq1[ch], freq2[ch]);
      count += n;
      matched.push({ letter: ch, count: n });
    }
  }
  return { count, matched };
}

/**
 * Given a match count, return the FLAKMES letter.
 */
function predict(count) {
  if (count === 0) return 'F'; // friendly fallback
  const idx = (count - 1) % FLAKMES.length;
  return FLAKMES[idx];
}

/**
 * Format a Date as a readable timestamp.
 */
function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/**
 * Sleep utility (returns a Promise).
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── History Management ─────────────────────────────────────

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function addToHistory(name1, name2, count, result) {
  const history = loadHistory();
  history.unshift({ name1, name2, count, result, ts: Date.now() });
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  saveHistory(history);
  renderHistory();
}

function renderHistory() {
  const history = loadHistory();
  historyList.innerHTML = '';
  if (history.length === 0) {
    historyList.innerHTML = '<li class="history-empty">No matches yet. Play your first game!</li>';
    return;
  }
  history.forEach(item => {
    const li = document.createElement('li');
    li.className = 'history-item';
    const color = COLORS[item.result] || '#a89bc2';
    li.innerHTML = `
      <div class="history-badge" style="background:${color}22;border:1.5px solid ${color};color:${color}">
        ${item.result}
      </div>
      <div class="history-info">
        <div class="history-names" title="${escHtml(item.name1)} ❤ ${escHtml(item.name2)}">
          ${escHtml(item.name1)} <span style="opacity:.5">❤</span> ${escHtml(item.name2)}
        </div>
        <div class="history-meta">
          Match count: ${item.count} &nbsp;·&nbsp; ${formatTime(item.ts)}
        </div>
      </div>
      <div class="history-result" style="color:${color}">
        ${item.result} – ${LABELS[item.result]}
      </div>
    `;
    historyList.appendChild(li);
  });
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Background Particles ───────────────────────────────────

function spawnParticles(count = 12) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    el.textContent = PARTICLE_SYMBOLS[Math.floor(Math.random() * PARTICLE_SYMBOLS.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.top = '105vh';
    el.style.animationDuration = (4 + Math.random() * 4) + 's';
    el.style.animationDelay = (Math.random() * 1.5) + 's';
    el.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
    partCont.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// Passive background particles
setInterval(() => spawnParticles(2), 2500);
spawnParticles(6);

// ── Letter Animation ───────────────────────────────────────

/**
 * Build a row of .letter-box spans for a name (preserving spaces).
 * Returns the container and a map: letter → array of box elements.
 */
function buildLetterBoxes(container, name) {
  container.innerHTML = '';
  const boxMap = {};  // lowercase letter → [elements]
  for (const ch of name) {
    const box = document.createElement('span');
    box.className = 'letter-box';
    if (ch === ' ') {
      box.classList.add('space');
    } else {
      box.textContent = ch;
      const key = ch.toLowerCase();
      if (!boxMap[key]) boxMap[key] = [];
      boxMap[key].push(box);
    }
    container.appendChild(box);
  }
  return boxMap;
}

/**
 * Reveal letter boxes one by one, then highlight matches.
 */
async function runMatchAnimation(name1, name2, matchedLetters) {
  // Build letter boxes
  const map1 = buildLetterBoxes(rowName1, name1);
  const map2 = buildLetterBoxes(rowName2, name2);

  // Reveal letter boxes with stagger
  const boxes1 = [...rowName1.querySelectorAll('.letter-box:not(.space)')];
  const boxes2 = [...rowName2.querySelectorAll('.letter-box:not(.space)')];
  const allBoxes = [];
  const maxLen = Math.max(boxes1.length, boxes2.length);
  for (let i = 0; i < maxLen; i++) {
    if (boxes1[i]) allBoxes.push(boxes1[i]);
    if (boxes2[i]) allBoxes.push(boxes2[i]);
  }

  // Initially hide all
  allBoxes.forEach(b => { b.style.opacity = '0'; b.style.transform = 'scale(0.5)'; b.style.transition = 'opacity 0.2s, transform 0.2s'; });

  for (let i = 0; i < allBoxes.length; i++) {
    await sleep(ANIM_LETTER_DELAY * 0.5);
    allBoxes[i].style.opacity = '1';
    allBoxes[i].style.transform = 'scale(1)';
  }

  await sleep(300);

  // Highlight matched letters with staggered slash animation
  for (const { letter, count: n } of matchedLetters) {
    const elems1 = map1[letter] || [];
    const elems2 = map2[letter] || [];

    for (let i = 0; i < n; i++) {
      if (elems1[i]) {
        elems1[i].classList.add('matched');
        const slash = document.createElement('span');
        slash.className = 'slash-through';
        elems1[i].appendChild(slash);
      }
      if (elems2[i]) {
        elems2[i].classList.add('matched');
        const slash = document.createElement('span');
        slash.className = 'slash-through';
        elems2[i].appendChild(slash);
      }
      await sleep(MATCH_REVEAL_DELAY);
    }
  }

  return;
}

// ── Special Overlays ───────────────────────────────────────

function showMarryOverlay() {
  marryOverlay.classList.remove('hidden');
  marryOverlay.setAttribute('aria-hidden', 'false');
  spawnFireworks();
  spawnParticles(20);

  const dismiss = () => {
    marryOverlay.classList.add('hidden');
    marryOverlay.setAttribute('aria-hidden', 'true');
    fireworksCont.innerHTML = '';
    marryOverlay.removeEventListener('click', dismiss);
  };
  marryOverlay.addEventListener('click', dismiss);
  setTimeout(dismiss, 6000);
}

function showEnemyOverlay() {
  enemyOverlay.classList.remove('hidden');
  enemyOverlay.setAttribute('aria-hidden', 'false');
  spawnLightning();

  const dismiss = () => {
    enemyOverlay.classList.add('hidden');
    enemyOverlay.setAttribute('aria-hidden', 'true');
    lightningCont.innerHTML = '';
    enemyOverlay.removeEventListener('click', dismiss);
  };
  enemyOverlay.addEventListener('click', dismiss);
  setTimeout(dismiss, 4000);
}

function spawnFireworks() {
  const colors = ['#ffd740', '#ff4081', '#40c4ff', '#69f0ae', '#e040fb', '#ff9100'];
  const cx = fireworksCont.offsetWidth / 2 || window.innerWidth / 2;
  const cy = fireworksCont.offsetHeight / 2 || window.innerHeight / 2;

  for (let burst = 0; burst < 6; burst++) {
    setTimeout(() => {
      const bx = (Math.random() - 0.5) * window.innerWidth * 0.8;
      const by = (Math.random() - 0.5) * window.innerHeight * 0.6;
      for (let i = 0; i < 16; i++) {
        const spark = document.createElement('div');
        spark.className = 'fw-spark';
        const angle = (i / 16) * Math.PI * 2;
        const dist = 60 + Math.random() * 80;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        spark.style.background = colors[Math.floor(Math.random() * colors.length)];
        spark.style.left = (50 + bx / window.innerWidth * 100) + '%';
        spark.style.top  = (50 + by / window.innerHeight * 100) + '%';
        spark.style.setProperty('--tx', `translate(${tx}px, ${ty}px)`);
        spark.style.animationDelay = (Math.random() * 0.3) + 's';
        fireworksCont.appendChild(spark);
      }
    }, burst * 600);
  }
}

function spawnLightning() {
  const bolts = ['⚡', '🌩️', '⚡'];
  bolts.forEach((bolt, i) => {
    const el = document.createElement('div');
    el.className = 'lightning-bolt';
    el.textContent = bolt;
    el.style.left = (15 + i * 35) + '%';
    el.style.top  = (20 + Math.random() * 40) + '%';
    el.style.animationDelay = (i * 0.25) + 's';
    el.style.animationDuration = '0.6s';
    lightningCont.appendChild(el);
    // Loop
    let count = 0;
    const interval = setInterval(() => {
      count++;
      if (count > 4) { clearInterval(interval); return; }
      el.style.animation = 'none';
      el.offsetHeight; // reflow
      el.style.animation = '';
      el.style.top = (20 + Math.random() * 40) + '%';
    }, 700);
  });
}

// ── Result Display ─────────────────────────────────────────

function showResult(name1, name2, count, resultKey) {
  resName1.textContent = name1;
  resName2.textContent = name2;
  resultLetter.textContent = resultKey;
  resultWord.textContent = LABELS[resultKey];
  resultDesc.textContent = DESCRIPTIONS[resultKey];

  // Clear previous theme classes
  resultBadge.className = 'result-badge';
  resultBadge.classList.add(`theme-${resultKey}`);
  resultLetter.style.color = COLORS[resultKey];

  resultSection.classList.remove('hidden');
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Special overlays
  if (resultKey === 'M') {
    setTimeout(showMarryOverlay, 800);
  } else if (resultKey === 'E') {
    setTimeout(showEnemyOverlay, 800);
  }
}

// ── Main Game Flow ─────────────────────────────────────────

async function runGame(name1, name2) {
  // Disable button
  playBtn.disabled = true;
  playBtn.querySelector('.btn-text').textContent = 'Calculating…';

  // Hide previous results
  resultSection.classList.add('hidden');

  // Show animation section
  animSection.classList.remove('hidden');
  animSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  countWrap.classList.add('hidden');

  // Compute
  const { count, matched } = countMatches(name1, name2);

  // Animate letter matching
  await runMatchAnimation(name1, name2, matched);

  // Show count
  await sleep(400);
  matchCountDisp.textContent = count;
  countWrap.classList.remove('hidden');
  countWrap.style.animation = 'none';
  countWrap.offsetHeight;
  countWrap.style.animation = '';

  await sleep(800);

  // Predict
  const resultKey = predict(count);

  // Show result
  showResult(name1, name2, count, resultKey);

  // Save to history
  addToHistory(name1, name2, count, resultKey);

  // Re-enable button
  playBtn.disabled = false;
  playBtn.querySelector('.btn-text').textContent = 'Find Compatibility ❤️';
}

// ── Validation ─────────────────────────────────────────────

function validateName(value, errEl) {
  if (!value.trim()) {
    errEl.textContent = 'Please enter a name.';
    return false;
  }
  if (!/[a-zA-Z]/.test(value)) {
    errEl.textContent = 'Name must contain at least one letter.';
    return false;
  }
  errEl.textContent = '';
  return true;
}

// ── Event Listeners ────────────────────────────────────────

form.addEventListener('submit', async e => {
  e.preventDefault();
  const v1 = validateName(name1Input.value, err1);
  const v2 = validateName(name2Input.value, err2);
  if (!v1 || !v2) {
    if (!v1) name1Input.classList.add('invalid');
    if (!v2) name2Input.classList.add('invalid');
    return;
  }
  await runGame(name1Input.value.trim(), name2Input.value.trim());
});

name1Input.addEventListener('input', () => {
  name1Input.classList.remove('invalid');
  err1.textContent = '';
});
name2Input.addEventListener('input', () => {
  name2Input.classList.remove('invalid');
  err2.textContent = '';
});

playAgainBtn.addEventListener('click', () => {
  resultSection.classList.add('hidden');
  animSection.classList.add('hidden');
  name1Input.value = '';
  name2Input.value = '';
  name1Input.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

clearHistBtn.addEventListener('click', () => {
  if (confirm('Clear all match history?')) {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  }
});

// ── Initialise ─────────────────────────────────────────────

renderHistory();

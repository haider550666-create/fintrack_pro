/**
 * FinTrack Pro - V2 Main Scripts
 * Handles floating particles, interactive live demo, and 3D tilt interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initHeroDashboard();
});

/* ==========================================================
   1. Floating Particles
   ========================================================== */
function initParticles() {
  const container = document.getElementById('particles-container');
  if (!container) return;

  const symbols = ['$', '€', '£', '¥', '₨', '%', '+', '📈'];
  const particleCount = 15;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'floating-particle';
    particle.innerText = symbols[Math.floor(Math.random() * symbols.length)];

    // Randomize position, delay, and duration
    particle.style.left = `${Math.random() * 100}vw`;
    const duration = 10 + Math.random() * 15; // 10s to 25s
    const delay = Math.random() * 10;

    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `-${delay}s`;
    particle.style.fontSize = `${1 + Math.random()}rem`;
    particle.style.opacity = `${0.05 + Math.random() * 0.1}`;

    container.appendChild(particle);
  }
}

/* ==========================================================
   2. Hero Dashboard Interactivity & 3D Tilt
   ========================================================== */
function initHeroDashboard() {
  const card = document.getElementById('heroDashboardCard');
  if (!card) return;

  // 3D Tilt Effect
  card.addEventListener('mousemove', (e) => {
    card.classList.add('tilt-active');
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation limits (max 10deg)
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    card.style.setProperty('--tiltX', `${rotateX}deg`);
    card.style.setProperty('--tiltY', `${rotateY}deg`);
  });

  card.addEventListener('mouseleave', () => {
    card.style.setProperty('--tiltX', `0deg`);
    card.style.setProperty('--tiltY', `0deg`);
    card.classList.remove('tilt-active');
  });

  // Random Live Updating Stats Simulator
  setInterval(() => {
    simulateLiveUpdate();
  }, 4000);
}

function simulateLiveUpdate() {
  const savingsVal = document.getElementById('heroSavingsVal');
  const savingsFill = document.getElementById('heroSavingsFill');
  const healthVal = document.getElementById('heroHealthVal');
  const healthFill = document.getElementById('heroHealthFill');

  if (!savingsVal || !savingsFill || !healthVal || !healthFill) return;

  // Small fluctuation in savings
  const newSavings = 72 + Math.floor(Math.random() * 3) - 1;
  savingsVal.innerText = `${newSavings}%`;
  savingsFill.style.width = `${newSavings}%`;

  savingsVal.classList.add('dashboard-emerald-pulse');
  setTimeout(() => savingsVal.classList.remove('dashboard-emerald-pulse'), 1500);

  // Small fluctuation in health score
  const newHealth = 85 + Math.floor(Math.random() * 3) - 1;
  healthVal.innerText = newHealth;
  healthFill.style.width = `${newHealth}%`;
}


/* ==========================================================
   3. Try Live Demo Sequence
   ========================================================== */
let demoSequenceActive = false;
let demoTimeouts = [];

window.openLiveDemo = function () {
  const modal = document.getElementById('liveDemoModal');
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  startLiveDemoSequence();
};

window.closeLiveDemo = function () {
  const modal = document.getElementById('liveDemoModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';

  // Clean up sequence
  demoSequenceActive = false;
  demoTimeouts.forEach(clearTimeout);
  demoTimeouts = [];
};

function startLiveDemoSequence() {
  demoSequenceActive = true;
  const incomeInput = document.getElementById('demoIncome');
  const expensesInput = document.getElementById('demoExpenses');
  const stepsContainer = document.getElementById('demoSteps');

  // Reset
  incomeInput.value = '';
  expensesInput.value = '';
  stepsContainer.innerHTML = '';

  const addStep = (html, delay) => {
    const p = new Promise(resolve => {
      const t = setTimeout(() => {
        if (!demoSequenceActive) return resolve();
        const div = document.createElement('div');
        div.innerHTML = html;
        div.style.opacity = '0';
        div.style.transform = 'translateY(10px)';
        div.style.transition = 'all 0.4s ease';
        stepsContainer.appendChild(div);

        // Trigger reflow
        div.offsetHeight;
        div.style.opacity = '1';
        div.style.transform = 'translateY(0)';

        resolve();
      }, delay);
      demoTimeouts.push(t);
    });
    return p;
  };

  const typeText = (el, text, delay) => {
    return new Promise(resolve => {
      const t = setTimeout(() => {
        if (!demoSequenceActive) return resolve();
        el.value = text;
        // flash green to indicate edit
        el.style.borderColor = 'var(--emerald)';
        setTimeout(() => el.style.borderColor = '', 500);
        resolve();
      }, delay);
      demoTimeouts.push(t);
    });
  };

  // Sequence script
  typeText(incomeInput, window.formatCurrency(80000), 500)
    .then(() => typeText(expensesInput, window.formatCurrency(66000), 1000))
    .then(() => addStep(`
      <div class="alert alert-info">
        <i class="fas fa-spinner fa-spin"></i> Analyzing financial data...
      </div>
    `, 800))
    .then(() => addStep(`
      <div class="stat-card" style="padding:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div class="stat-label">Calculated Savings</div>
            <div class="stat-value" style="color:var(--emerald);">${window.formatCurrency(14000)}</div>
          </div>
          <div class="badge badge-stable">Savings Rate: 17.5%</div>
        </div>
      </div>
    `, 1200))
    .then(() => addStep(`
      <div class="alert alert-warning">
        <i class="fas fa-exclamation-triangle"></i> <strong>Risk Detected:</strong> High expense ratio. 82.5% of income is being spent.
      </div>
    `, 1500))
    .then(() => addStep(`
      <div class="card card-sm">
        <div style="display:flex; align-items:center; gap:1rem;">
          <div class="score-ring" style="width:60px; height:60px;">
            <svg width="60" height="60" viewBox="0 0 150 150">
              <circle class="track" cx="75" cy="75" r="70"></circle>
              <circle class="progress" cx="75" cy="75" r="70" style="stroke:var(--cyan); stroke-dashoffset:123.1;"></circle>
            </svg>
            <div class="center-text">
              <span style="font-size:1.2rem; font-weight:bold;">72</span>
            </div>
          </div>
          <div>
            <h4 style="margin:0;">Final Health Score</h4>
            <p style="margin:0; font-size:0.85rem; color:var(--cyan);">Status: Stable</p>
          </div>
        </div>
      </div>
    `, 1500))
    .then(() => addStep(`
      <button class="btn btn-primary btn-full mt-3" onclick="window.location.href='/register'"><i class="fas fa-rocket"></i> Get Your Real Score</button>
    `, 1000));
}

// Close explicitly if clicked outside generic video modal overlay
document.addEventListener('click', (e) => {
  const liveDemoModal = document.getElementById('liveDemoModal');
  if (e.target === liveDemoModal) closeLiveDemo();
});

/* ==========================================================
   4. Theme Toggle (Dark/Light Mode)
   ========================================================== */
window.toggleTheme = function () {
  const root = document.documentElement;
  const isLight = root.classList.toggle('light-mode');
  localStorage.setItem('fintrack_theme', isLight ? 'light' : 'dark');

  // Update icons
  document.querySelectorAll('#themeToggle i').forEach(icon => {
    icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
    icon.style.transform = 'rotate(360deg)';
    icon.style.transition = 'transform 0.5s ease';
    setTimeout(() => icon.style.transform = '', 500);
  });
};

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('fintrack_theme') === 'light') {
    document.documentElement.classList.add('light-mode');
    document.querySelectorAll('#themeToggle i').forEach(icon => icon.className = 'fas fa-sun');
  }
});

/* ==========================================================
   5. Currency Switcher
   ========================================================== */
const CONVERSION_RATES = {
  'USD': 1.00,
  'PKR': 278.50,
  'EUR': 0.92,
  'GBP': 0.79
};

const CURRENCY_SYMBOLS = {
  'USD': '$',
  'PKR': '₨',
  'EUR': '€',
  'GBP': '£'
};

window.currentCurrency = localStorage.getItem('fintrack_currency') || 'USD';

window.formatCurrency = function (value) {
  if (value === undefined || value === null) value = 0;
  const rate = CONVERSION_RATES[window.currentCurrency] || 1;
  const symbol = CURRENCY_SYMBOLS[window.currentCurrency] || '$';
  return symbol + (value * rate).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

window.changeCurrency = function (targetCurrency) {
  if (!CONVERSION_RATES[targetCurrency]) return;
  window.currentCurrency = targetCurrency;
  localStorage.setItem('fintrack_currency', targetCurrency);

  document.querySelectorAll('#currencySelect').forEach(select => {
    select.value = targetCurrency;
  });

  document.body.style.opacity = '0.5';
  document.body.style.transition = 'opacity 0.3s ease';

  setTimeout(() => {
    window.dispatchEvent(new Event('currencyChanged'));
    document.body.style.opacity = '1';
  }, 300);
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.currentCurrency !== 'USD') {
    document.querySelectorAll('#currencySelect').forEach(s => s.value = window.currentCurrency);
  }
});

/* ==========================================================
   6. General Helpers (Counters, Auth, Video Modal)
   ========================================================== */
const animateCounters = () => {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = Math.floor(current).toLocaleString() + (target > 100 ? '+' : '%');
    }, 16);
  });
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); }
  });
}, { threshold: 0.15 });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  setTimeout(animateCounters, 600);

  if (localStorage.getItem('fintrack_token')) {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      navLinks.innerHTML = `
        <li><a href="#features">Features</a></li>
        <li>
          <select class="lang-select" id="currencySelect" onchange="window.changeCurrency && window.changeCurrency(this.value)">
            <option value="PKR">🇵🇰 PKR</option><option value="USD">🇺🇸 USD</option>
            <option value="EUR">🇪🇺 EUR</option><option value="GBP">🇬🇧 GBP</option>
          </select>
        </li>
        <li><select class="lang-select" id="langSelect">
          <option value="en">🇬🇧 English</option><option value="es">🇪🇸 Español</option>
          <option value="fr">🇫🇷 Français</option><option value="ar">🇸🇦 العربية</option>
          <option value="ur">🇵🇰 اردو</option>
        </select></li>
        <li><button onclick="window.toggleTheme && window.toggleTheme()" class="btn btn-secondary btn-sm" id="themeToggle" style="padding:0.4rem 0.6rem; border-radius:50%;"><i class="fas fa-moon"></i></button></li>
        <li><a href="/dashboard" class="btn btn-primary btn-sm"><i class="fas fa-tachometer-alt"></i> Dashboard</a></li>
      `;
      const savedCurrency = localStorage.getItem('fintrack_currency') || 'USD';
      document.querySelectorAll('#currencySelect').forEach(s => s.value = savedCurrency);
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (typeof window.closeLiveDemo === 'function') window.closeLiveDemo();
  }
});

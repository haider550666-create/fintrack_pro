/**
 * FinTrack Pro – Dashboard Controller
 * Handles charts, score animation, form submission, history, and comparison
 */

(function () {
    'use strict';

    // ─── Auth Guard ────────────────────────────────────────────────────────────
    const TOKEN = localStorage.getItem('fintrack_token') || 'dummy-token';
    const USER = JSON.parse(localStorage.getItem('fintrack_user') || '{"name":"Guest User"}');

    // ─── API Helpers ───────────────────────────────────────────────────────────
    const API = {
        headers() {
            return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` };
        },
        async get(url) {
            const res = await fetch(url, { headers: this.headers() });
            return res.json();
        },
        async post(url, body) {
            const res = await fetch(url, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) });
            return res.json();
        },
        async del(url) {
            const res = await fetch(url, { method: 'DELETE', headers: this.headers() });
            return res.json();
        }
    };

    // ─── Toast ─────────────────────────────────────────────────────────────────
    function toast(msg, type = 'success') {
        const container = document.getElementById('toastContainer');
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'info' ? 'info-circle' : 'check-circle'}"></i> ${msg}`;
        container.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, 3500);
    }

    // ─── Logout ────────────────────────────────────────────────────────────────
    window.logout = function () {
        localStorage.removeItem('fintrack_token');
        localStorage.removeItem('fintrack_user');
        window.location.href = '/login';
    };

    // ─── Chart Instances ───────────────────────────────────────────────────────
    let expenseChart, incomeChart, projectionChart;

    const chartColors = {
        housing: '#10B981',
        food: '#06B6D4',
        transport: '#F97316',
        utilities: '#EAB308',
        healthcare: '#EF4444',
        entertainment: '#8B5CF6',
        education: '#3B82F6',
        other: '#94A3B8'
    };

    const chartLabels = {
        housing: '🏠 Housing',
        food: '🍽️ Food',
        transport: '🚗 Transport',
        utilities: '⚡ Utilities',
        healthcare: '🏥 Healthcare',
        entertainment: '🎬 Entertainment',
        education: '📚 Education',
        other: '📦 Other'
    };

    // Chart.js defaults
    Chart.defaults.color = '#94A3B8';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // ─── Score Meter Animation ─────────────────────────────────────────────────
    function animateScore(score, riskLevel) {
        const circle = document.getElementById('scoreProgress');
        const valueEl = document.getElementById('scoreValue');
        const badgeEl = document.getElementById('scoreRiskBadge');

        if (!circle || !valueEl) return;

        const circumference = 2 * Math.PI * 70; // r=70
        const offset = circumference - (score / 100) * circumference;
        const color = FinCalc.riskColor(riskLevel);

        circle.style.stroke = color;
        circle.style.strokeDasharray = circumference;

        // Animate with delay
        setTimeout(() => {
            circle.style.strokeDashoffset = offset;
        }, 300);

        // Count up animation
        let current = 0;
        const step = score / 60;
        const timer = setInterval(() => {
            current += step;
            if (current >= score) { current = score; clearInterval(timer); }
            valueEl.textContent = Math.round(current);
            valueEl.style.color = color;
        }, 16);

        // Risk badge
        if (badgeEl) {
            badgeEl.innerHTML = `<span class="badge ${FinCalc.riskBadgeClass(riskLevel)}">${riskLevel}</span>`;
        }
    }

    // ─── Update KPI Cards ─────────────────────────────────────────────────────
    function updateKPIs(data) {
        const scoreEl = document.getElementById('kpiScore');
        const savingsEl = document.getElementById('kpiSavings');
        const balanceEl = document.getElementById('kpiBalance');
        const riskEl = document.getElementById('kpiRisk');

        if (scoreEl) {
            scoreEl.textContent = data.financialScore;
            scoreEl.style.color = FinCalc.riskColor(data.riskLevel);
        }
        if (savingsEl) savingsEl.textContent = data.savingsRate + '%';
        if (balanceEl) {
            balanceEl.textContent = window.formatCurrency(data.monthlyBalance);
            balanceEl.style.color = data.monthlyBalance >= 0 ? '#10B981' : '#EF4444';
        }
        if (riskEl) {
            riskEl.innerHTML = `<span class="badge ${FinCalc.riskBadgeClass(data.riskLevel)}">${data.riskLevel}</span>`;
        }

        // Gamification unlock checks
        if (data.savingsRate >= 20) {
            document.getElementById('badgeSaver')?.classList.remove('locked');
            document.getElementById('badgeSaver')?.classList.add('unlocked');
        } else {
            document.getElementById('badgeSaver')?.classList.add('locked');
            document.getElementById('badgeSaver')?.classList.remove('unlocked');
        }

        if (data.financialScore >= 80) {
            document.getElementById('badgeSafe')?.classList.remove('locked');
            document.getElementById('badgeSafe')?.classList.add('unlocked');
        } else {
            document.getElementById('badgeSafe')?.classList.add('locked');
            document.getElementById('badgeSafe')?.classList.remove('unlocked');
        }
    }

    // ─── Render Expense Pie Chart ──────────────────────────────────────────────
    function renderExpenseChart(expenses) {
        const ctx = document.getElementById('expenseChart');
        if (!ctx) return;

        const labels = [];
        const values = [];
        const colors = [];

        Object.entries(expenses).forEach(([key, val]) => {
            if (val > 0) {
                labels.push(chartLabels[key] || key);
                values.push(val);
                colors.push(chartColors[key] || '#94A3B8');
            }
        });

        if (expenseChart) expenseChart.destroy();

        expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels, datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true, pointStyleWidth: 10, font: { size: 11 } } }
                }
            }
        });
    }

    // ─── Render Income vs Expense Bar Chart ────────────────────────────────────
    function renderIncomeChart(income, totalExpenses, savings) {
        const ctx = document.getElementById('incomeChart');
        if (!ctx) return;

        if (incomeChart) incomeChart.destroy();

        incomeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Income', 'Expenses', 'Savings'],
                datasets: [{
                    data: [income, totalExpenses, Math.max(0, savings)],
                    backgroundColor: ['rgba(16,185,129,0.7)', 'rgba(239,68,68,0.7)', 'rgba(6,182,212,0.7)'],
                    borderColor: ['#10B981', '#EF4444', '#06B6D4'],
                    borderWidth: 2,
                    borderRadius: 8,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: v => window.formatCurrency(v) }
                    }
                }
            }
        });
    }

    // ─── Render 6-Month Projection Line Chart ─────────────────────────────────
    function renderProjectionChart(projection) {
        const ctx = document.getElementById('projectionChart');
        if (!ctx) return;

        const months = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'];

        if (projectionChart) projectionChart.destroy();

        projectionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Projected Savings ($)',
                    data: projection,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#0F172A',
                    pointBorderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: { callback: v => window.formatCurrency(v) }
                    }
                }
            }
        });
    }

    // ─── Update Tips ───────────────────────────────────────────────────────────
    function updateTips(analysis) {
        const tipsList = document.getElementById('tipsList');
        if (!tipsList) return;

        const tips = [];
        const sr = analysis.savingsRate;
        const score = analysis.financialScore;
        const ratio = analysis.totalExpenses / (analysis.totalExpenses + analysis.monthlyBalance) || 0;

        if (sr < 10) tips.push('📌 Try to save at least 10–20% of your income each month.');
        if (ratio > 0.8) tips.push('📌 Your expenses are over 80% of income. Review discretionary spending.');
        if (score < 40) tips.push('🚨 Critical financial health. Build an emergency fund immediately.');
        if (score >= 80) tips.push('🌟 Excellent health! Consider investing your surplus savings.');
        if (sr >= 20) tips.push('✅ Great savings rate! Keep maintaining this discipline.');
        if (analysis.monthlyBalance < 0) tips.push('⚠️ You\'re spending more than you earn. Reduce non-essential expenses.');
        if (tips.length === 0) tips.push('✅ Your finances look balanced. Keep tracking monthly to stay on top!');

        tipsList.innerHTML = tips.map(t => `<div class="tip-item">${t}</div>`).join('');
    }

    // ─── Render History Table ──────────────────────────────────────────────────
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function renderHistory(records) {
        const tbody = document.getElementById('historyBody');
        if (!tbody) return;

        if (!records || records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:2rem;">No financial records yet.</td></tr>';
            document.getElementById('badgeGrowth')?.classList.add('locked');
            document.getElementById('badgeGrowth')?.classList.remove('unlocked');
            return;
        }

        if (records.length >= 3) {
            document.getElementById('badgeGrowth')?.classList.remove('locked');
            document.getElementById('badgeGrowth')?.classList.add('unlocked');
        } else {
            document.getElementById('badgeGrowth')?.classList.add('locked');
            document.getElementById('badgeGrowth')?.classList.remove('unlocked');
        }

        tbody.innerHTML = records.map(r => `
      <tr>
        <td><strong>${monthNames[r.month - 1]} ${r.year}</strong></td>
        <td style="color:var(--emerald)">${window.formatCurrency(r.income)}</td>
        <td style="color:var(--red)">${window.formatCurrency(r.totalExpenses)}</td>
        <td style="color:${(r.monthlyBalance || 0) >= 0 ? 'var(--emerald)' : 'var(--red)'}">${window.formatCurrency(r.monthlyBalance)}</td>
        <td><strong style="color:${FinCalc.riskColor(r.riskLevel)}">${r.financialScore || 0}</strong></td>
        <td><span class="badge ${FinCalc.riskBadgeClass(r.riskLevel || 'Risky')}">${r.riskLevel || '--'}</span></td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteRecord('${r._id}')"><i class="fas fa-trash"></i></button></td>
      </tr>
    `).join('');
    }

    // ─── Delete Record ─────────────────────────────────────────────────────────
    window.deleteRecord = async function (id) {
        if (!confirm('Delete this financial record?')) return;
        const data = await API.del(`/api/finance/${id}`);
        if (data?.success) { toast('Record deleted'); loadHistory(); }
        else toast(data?.error || 'Failed to delete', 'error');
    };

    // ─── Render Comparison ─────────────────────────────────────────────────────
    function renderComparison(comp) {
        const section = document.getElementById('comparisonSection');
        const content = document.getElementById('compareContent');
        if (!section || !content || !comp) return;

        if (!comp.previous) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        const d = comp.delta;
        const arrow = (val) => val > 0 ? `<span style="color:#10B981">▲ +${val.toLocaleString()}</span>` : val < 0 ? `<span style="color:#EF4444">▼ ${val.toLocaleString()}</span>` : '<span style="color:var(--text-muted)">—</span>';

        content.innerHTML = `
      <div class="card card-sm">
        <h3 style="margin-bottom:1rem; color:var(--text-muted); font-size:0.85rem;">${monthNames[comp.previous.month - 1]} ${comp.previous.year}</h3>
        <div class="compare-item"><div class="compare-value" style="color:var(--emerald)">${window.formatCurrency(comp.previous.income)}</div><div class="compare-label">Income</div></div>
        <div class="divider"></div>
        <div class="compare-item"><div class="compare-value" style="color:var(--red)">${window.formatCurrency(comp.previous.totalExpenses)}</div><div class="compare-label">Expenses</div></div>
        <div class="divider"></div>
        <div class="compare-item"><div class="compare-value" style="color:${FinCalc.riskColor(comp.previous.riskLevel)}">${comp.previous.financialScore}</div><div class="compare-label">Score</div></div>
      </div>
      <div class="compare-vs">
        <div>VS</div>
        <div style="font-size:0.7rem; margin-top:0.5rem;">
          ${arrow(d.financialScore)} score<br>
          ${arrow(d.savingsRate)}% savings
        </div>
      </div>
      <div class="card card-sm">
        <h3 style="margin-bottom:1rem; color:var(--emerald); font-size:0.85rem;">${monthNames[comp.current.month - 1]} ${comp.current.year}</h3>
        <div class="compare-item"><div class="compare-value" style="color:var(--emerald)">${window.formatCurrency(comp.current.income)}</div><div class="compare-label">Income</div></div>
        <div class="divider"></div>
        <div class="compare-item"><div class="compare-value" style="color:var(--red)">${window.formatCurrency(comp.current.totalExpenses)}</div><div class="compare-label">Expenses</div></div>
        <div class="divider"></div>
        <div class="compare-item"><div class="compare-value" style="color:${FinCalc.riskColor(comp.current.riskLevel)}">${comp.current.financialScore}</div><div class="compare-label">Score</div></div>
      </div>
    `;
    }

    // ─── Load Data ─────────────────────────────────────────────────────────────
    async function loadLatest() {
        const data = await API.get('/api/finance/latest');
        if (data?.success && data.record) {
            const r = data.record;
            updateKPIs(r);
            animateScore(r.financialScore, r.riskLevel);
            updateTips(r);

            // Show charts
            document.getElementById('chartsSection').style.display = '';
            document.getElementById('projectionSection').style.display = '';
            renderExpenseChart(r.expenses);
            renderIncomeChart(r.income, r.totalExpenses, r.monthlyBalance);
            renderProjectionChart(r.projection);
        }
    }

    async function loadHistory() {
        const data = await API.get('/api/finance/history');
        if (data?.success) renderHistory(data.records);
    }

    async function loadComparison() {
        const data = await API.get('/api/finance/compare');
        if (data?.success && data.comparison) renderComparison(data.comparison);
    }

    // ─── Form Submission ───────────────────────────────────────────────────────
    document.getElementById('financeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('analyzeBtn');
        btn.disabled = true;
        btn.classList.add('btn-loading');
        btn.innerHTML = 'Analyzing...';

        // Gather expense inputs
        const expenses = {};
        document.querySelectorAll('.expense-input').forEach(input => {
            expenses[input.dataset.key] = parseFloat(input.value) || 0;
        });

        const payload = {
            month: parseInt(document.getElementById('month').value),
            year: parseInt(document.getElementById('year').value),
            income: parseFloat(document.getElementById('income').value) || 0,
            emergencyFund: parseFloat(document.getElementById('emergencyFund').value) || 0,
            expenses
        };

        try {
            const data = await API.post('/api/finance/analyze', payload);

            if (data?.success) {
                toast('Financial analysis saved!');
                const a = data.analysis;

                // Update dashboard
                updateKPIs(a);
                animateScore(a.financialScore, a.riskLevel);
                updateTips(a);

                // Show and render charts
                document.getElementById('chartsSection').style.display = '';
                document.getElementById('projectionSection').style.display = '';
                renderExpenseChart(a.expenseBreakdown || expenses);
                renderIncomeChart(payload.income, a.totalExpenses, a.monthlyBalance);
                renderProjectionChart(a.projection);

                // Reload ancillary data
                loadHistory();
                loadComparison();

                // Scroll to results
                document.getElementById('chartsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                toast(data?.error || data?.errors?.[0]?.msg || 'Analysis failed', 'error');
            }
        } catch (err) {
            toast('Network error. Please try again.', 'error');
            console.error(err);
        }

        btn.disabled = false;
        btn.classList.remove('btn-loading');
        btn.innerHTML = '<i class="fas fa-chart-line"></i> Analyze My Finances';
    });

    // ─── Scroll Reveal ─────────────────────────────────────────────────────────
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // ─── Init ──────────────────────────────────────────────────────────────────
    function init() {
        // Set user name
        const nameEl = document.getElementById('userName');
        if (nameEl && USER.name) nameEl.textContent = USER.name;

        // Set current month/year
        const now = new Date();
        const monthSelect = document.getElementById('month');
        const yearInput = document.getElementById('year');
        if (monthSelect) monthSelect.value = now.getMonth() + 1;
        if (yearInput) yearInput.value = now.getFullYear();

        // Load existing data
        loadLatest();
        loadHistory();
        loadComparison();
    }

    // Listen for currency changed event to update dashboard displays
    window.addEventListener('currencyChanged', () => {
        loadLatest();
        loadHistory();
        loadComparison();
    });

    init();
})();

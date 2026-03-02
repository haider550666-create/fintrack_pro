/**
 * FinTrack Pro – Client-Side Financial Calculator
 * Mirror of server-side engine for instant preview
 */

const FinCalc = {
    totalExpenses(expenses) {
        return Object.values(expenses).reduce((s, v) => s + (parseFloat(v) || 0), 0);
    },

    savingsRate(income, totalExp) {
        if (income <= 0) return 0;
        return Math.max(0, Math.round(((income - totalExp) / income) * 10000) / 100);
    },

    financialScore(income, totalExp, savingsRate, emergencyFund) {
        if (income <= 0) return 0;

        // Savings Rate Score (40%)
        let ss = 0;
        if (savingsRate >= 30) ss = 100;
        else if (savingsRate >= 20) ss = 80;
        else if (savingsRate >= 10) ss = 60;
        else if (savingsRate >= 5) ss = 40;
        else if (savingsRate > 0) ss = 20;

        // Emergency Fund Score (30%)
        let es = 0;
        if (emergencyFund >= totalExp * 6) es = 100;
        else if (emergencyFund >= totalExp * 3) es = 85;
        else if (emergencyFund >= totalExp * 1.5) es = 65;
        else if (emergencyFund >= totalExp) es = 45;
        else if (emergencyFund > 0) es = 25;

        // Expense Ratio Score (30%)
        const ratio = totalExp / income;
        let xs = 0;
        if (ratio <= 0.5) xs = 100;
        else if (ratio <= 0.65) xs = 80;
        else if (ratio <= 0.75) xs = 60;
        else if (ratio <= 0.85) xs = 40;
        else if (ratio <= 0.95) xs = 20;

        return Math.round(ss * 0.4 + es * 0.3 + xs * 0.3);
    },

    riskLevel(score) {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Stable';
        if (score >= 40) return 'Risky';
        return 'Critical';
    },

    riskColor(level) {
        const colors = { Excellent: '#10B981', Stable: '#06B6D4', Risky: '#F97316', Critical: '#EF4444' };
        return colors[level] || '#94A3B8';
    },

    riskBadgeClass(level) {
        return 'badge-' + level.toLowerCase();
    },

    project6Months(income, totalExp, savings) {
        const monthly = Math.max(0, income - totalExp);
        const proj = [];
        let bal = savings;
        for (let i = 0; i < 6; i++) {
            bal = (bal + monthly) * 1.003;
            proj.push(Math.round(bal));
        }
        return proj;
    },

    analyze(data) {
        const te = this.totalExpenses(data.expenses);
        const sr = this.savingsRate(data.income, te);
        const balance = data.income - te;
        const score = this.financialScore(data.income, te, sr, data.emergencyFund || 0);
        const risk = this.riskLevel(score);
        const proj = this.project6Months(data.income, te, data.emergencyFund || 0);
        return { totalExpenses: te, savingsRate: sr, monthlyBalance: balance, financialScore: score, riskLevel: risk, projection: proj };
    }
};

// Make available globally
if (typeof window !== 'undefined') window.FinCalc = FinCalc;

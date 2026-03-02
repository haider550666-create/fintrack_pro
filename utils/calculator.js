/**
 * FinTrack Pro – Financial Calculation Engine
 * Pure mathematical/rule-based logic. No external AI APIs.
 */

/**
 * Calculate total expenses from expense category object
 */
const calculateTotalExpenses = (expenses) => {
    return Object.values(expenses).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
};

/**
 * Savings Rate = (Income - Total Expenses) / Income × 100
 */
const calculateSavingsRate = (income, totalExpenses) => {
    if (income <= 0) return 0;
    const rate = ((income - totalExpenses) / income) * 100;
    return Math.max(0, Math.round(rate * 100) / 100);
};

/**
 * Financial Health Score (0–100) based on multiple factors:
 * - Savings Rate (40% weight)
 * - Emergency Fund Adequacy (30% weight): Ideal = 3–6 months of expenses
 * - Expense Ratio (30% weight): expenses/income ratio
 */
const calculateFinancialScore = (income, totalExpenses, savingsRate, emergencyFund) => {
    if (income <= 0) return 0;

    // Component 1: Savings Rate Score (40%)
    let savingsScore = 0;
    if (savingsRate >= 30) savingsScore = 100;
    else if (savingsRate >= 20) savingsScore = 80;
    else if (savingsRate >= 10) savingsScore = 60;
    else if (savingsRate >= 5) savingsScore = 40;
    else if (savingsRate > 0) savingsScore = 20;
    else savingsScore = 0;

    // Component 2: Emergency Fund Score (30%)
    // Ideal: 3 months of expenses
    const monthlyExpenses = totalExpenses;
    const idealEmergencyFund = monthlyExpenses * 3;
    let emergencyScore = 0;
    if (emergencyFund >= monthlyExpenses * 6) emergencyScore = 100;
    else if (emergencyFund >= monthlyExpenses * 3) emergencyScore = 85;
    else if (emergencyFund >= monthlyExpenses * 1.5) emergencyScore = 65;
    else if (emergencyFund >= monthlyExpenses) emergencyScore = 45;
    else if (emergencyFund > 0) emergencyScore = 25;
    else emergencyScore = 0;

    // Component 3: Expense Ratio Score (30%)
    const expenseRatio = totalExpenses / income;
    let expenseScore = 0;
    if (expenseRatio <= 0.5) expenseScore = 100;
    else if (expenseRatio <= 0.65) expenseScore = 80;
    else if (expenseRatio <= 0.75) expenseScore = 60;
    else if (expenseRatio <= 0.85) expenseScore = 40;
    else if (expenseRatio <= 0.95) expenseScore = 20;
    else expenseScore = 0;

    const finalScore = (savingsScore * 0.4) + (emergencyScore * 0.3) + (expenseScore * 0.3);
    return Math.round(finalScore);
};

/**
 * Determine risk level from financial score
 */
const determineRiskLevel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Stable';
    if (score >= 40) return 'Risky';
    return 'Critical';
};

/**
 * Generate 6-month savings projection
 * Uses compound growth based on current savings rate
 */
const project6Months = (income, totalExpenses, currentSavings) => {
    const monthlySavings = Math.max(0, income - totalExpenses);
    const projection = [];
    let runningBalance = currentSavings;

    for (let i = 1; i <= 6; i++) {
        runningBalance += monthlySavings;
        // Small interest assumption: 0.3% monthly (3.6% annual)
        runningBalance = runningBalance * 1.003;
        projection.push(Math.round(runningBalance));
    }
    return projection;
};

/**
 * Get financial tips based on score and data
 */
const getFinancialTips = (score, savingsRate, expenseRatio) => {
    const tips = [];

    if (savingsRate < 10) {
        tips.push('📌 Try to save at least 10–20% of your income each month.');
    }
    if (expenseRatio > 0.8) {
        tips.push('📌 Your expenses are over 80% of income. Review discretionary spending.');
    }
    if (score < 40) {
        tips.push('🚨 Critical financial health. Consider building an emergency fund immediately.');
    }
    if (score >= 80) {
        tips.push('🌟 Excellent financial health! Consider investing surplus savings.');
    }
    if (savingsRate >= 20) {
        tips.push('✅ Great savings rate! Keep maintaining this discipline.');
    }

    return tips;
};

/**
 * Full analysis – combines all calculations
 */
const analyzeFinancials = (data) => {
    const { income, expenses, emergencyFund = 0 } = data;
    const totalExpenses = calculateTotalExpenses(expenses);
    const savingsRate = calculateSavingsRate(income, totalExpenses);
    const monthlyBalance = income - totalExpenses;
    const financialScore = calculateFinancialScore(income, totalExpenses, savingsRate, emergencyFund);
    const riskLevel = determineRiskLevel(financialScore);
    const projection = project6Months(income, totalExpenses, emergencyFund);
    const expenseRatio = income > 0 ? totalExpenses / income : 1;
    const tips = getFinancialTips(financialScore, savingsRate, expenseRatio);

    return {
        totalExpenses,
        savingsRate,
        monthlyBalance,
        financialScore,
        riskLevel,
        projection,
        tips,
        expenseBreakdown: expenses
    };
};

module.exports = {
    calculateTotalExpenses,
    calculateSavingsRate,
    calculateFinancialScore,
    determineRiskLevel,
    project6Months,
    getFinancialTips,
    analyzeFinancials
};

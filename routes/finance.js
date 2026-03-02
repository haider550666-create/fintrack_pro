const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { analyzeFinancials } = require('../utils/calculator');

const router = express.Router();

// In-memory storage for local use without database
let records = [];

// All routes are protected
router.use(protect);

// ─── POST /api/finance/analyze ───────────────────────────────────────────────
router.post('/analyze', [
    body('income').isNumeric().isFloat({ min: 0 }).withMessage('Valid income required'),
    body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month required'),
    body('year').isInt({ min: 2020, max: 2100 }).withMessage('Valid year required'),
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { income, expenses = {}, emergencyFund = 0, month, year } = req.body;

        // Run calculation engine
        const analysis = analyzeFinancials({
            income: parseFloat(income),
            expenses: {
                housing: parseFloat(expenses.housing) || 0,
                food: parseFloat(expenses.food) || 0,
                transport: parseFloat(expenses.transport) || 0,
                utilities: parseFloat(expenses.utilities) || 0,
                healthcare: parseFloat(expenses.healthcare) || 0,
                entertainment: parseFloat(expenses.entertainment) || 0,
                education: parseFloat(expenses.education) || 0,
                other: parseFloat(expenses.other) || 0
            },
            emergencyFund: parseFloat(emergencyFund)
        });

        // Upsert record
        const newRecord = {
            _id: Date.now().toString(),
            userId: req.user._id,
            month: parseInt(month),
            year: parseInt(year),
            income: parseFloat(income),
            expenses: analysis.expenseBreakdown,
            totalExpenses: analysis.totalExpenses,
            savings: analysis.monthlyBalance,
            emergencyFund: parseFloat(emergencyFund),
            savingsRate: analysis.savingsRate,
            financialScore: analysis.financialScore,
            riskLevel: analysis.riskLevel,
            monthlyBalance: analysis.monthlyBalance,
            projection: analysis.projection,
            createdAt: new Date()
        };

        // Remove existing record for same month/year
        records = records.filter(r => !(r.month === newRecord.month && r.year === newRecord.year && String(r.userId) === String(req.user._id)));
        records.push(newRecord);

        // Sort records by Date descending (newest first)
        records.sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            return b.month - a.month;
        });

        res.json({
            success: true,
            message: 'Financial analysis saved locally!',
            record: newRecord,
            analysis: {
                ...analysis,
                recordId: newRecord._id
            }
        });
    } catch (err) {
        console.error('Analyze error:', err);
        res.status(500).json({ success: false, error: 'Failed to save financial analysis.' });
    }
});

// ─── GET /api/finance/history ────────────────────────────────────────────────
router.get('/history', (req, res) => {
    try {
        const userRecords = records
            .filter(r => String(r.userId) === String(req.user._id))
            .slice(0, 12);

        res.json({ success: true, count: userRecords.length, records: userRecords });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch history.' });
    }
});

// ─── GET /api/finance/compare ────────────────────────────────────────────────
router.get('/compare', (req, res) => {
    try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

        const current = records.find(r => String(r.userId) === String(req.user._id) && r.month === currentMonth && r.year === currentYear);
        const previous = records.find(r => String(r.userId) === String(req.user._id) && r.month === prevMonth && r.year === prevYear);

        if (!current) {
            return res.json({ success: true, comparison: null, message: 'No current month data yet.' });
        }

        const comparison = {
            current: {
                month: current.month, year: current.year,
                income: current.income, totalExpenses: current.totalExpenses,
                financialScore: current.financialScore, riskLevel: current.riskLevel,
                savingsRate: current.savingsRate, monthlyBalance: current.monthlyBalance
            },
            previous: previous ? {
                month: previous.month, year: previous.year,
                income: previous.income, totalExpenses: previous.totalExpenses,
                financialScore: previous.financialScore, riskLevel: previous.riskLevel,
                savingsRate: previous.savingsRate, monthlyBalance: previous.monthlyBalance
            } : null,
            delta: previous ? {
                income: current.income - previous.income,
                totalExpenses: current.totalExpenses - previous.totalExpenses,
                financialScore: current.financialScore - previous.financialScore,
                savingsRate: current.savingsRate - previous.savingsRate,
                monthlyBalance: current.monthlyBalance - previous.monthlyBalance
            } : null
        };

        res.json({ success: true, comparison });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch comparison.' });
    }
});

// ─── GET /api/finance/latest ────────────────────────────────────────────────
router.get('/latest', (req, res) => {
    try {
        const userRecords = records.filter(r => String(r.userId) === String(req.user._id));
        const record = userRecords.length > 0 ? userRecords[0] : null;

        res.json({ success: true, record });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch latest record.' });
    }
});

// ─── DELETE /api/finance/:id ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
    try {
        const initialLength = records.length;
        records = records.filter(r => !(r._id === req.params.id && String(r.userId) === String(req.user._id)));

        if (records.length === initialLength) {
            return res.status(404).json({ success: false, error: 'Record not found.' });
        }
        res.json({ success: true, message: 'Record deleted locally.' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to delete record.' });
    }
});

module.exports = router;

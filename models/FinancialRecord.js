const mongoose = require('mongoose');

const financialRecordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    },
    income: {
        type: Number,
        required: [true, 'Income is required'],
        min: [0, 'Income cannot be negative']
    },
    expenses: {
        housing: { type: Number, default: 0 },
        food: { type: Number, default: 0 },
        transport: { type: Number, default: 0 },
        utilities: { type: Number, default: 0 },
        healthcare: { type: Number, default: 0 },
        entertainment: { type: Number, default: 0 },
        education: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    },
    totalExpenses: {
        type: Number,
        default: 0
    },
    savings: {
        type: Number,
        default: 0
    },
    emergencyFund: {
        type: Number,
        default: 0
    },
    savingsRate: {
        type: Number,
        default: 0
    },
    financialScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    riskLevel: {
        type: String,
        enum: ['Excellent', 'Stable', 'Risky', 'Critical'],
        default: 'Risky'
    },
    monthlyBalance: {
        type: Number,
        default: 0
    },
    projection: {
        type: [Number],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure one record per user per month/year
financialRecordSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('FinancialRecord', financialRecordSchema);

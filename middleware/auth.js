const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    // Bypass authentication for seamless access without login
    // Assigning a fixed dummy object ID for all finance records
    req.user = { _id: '000000000000000000000000' };
    next();
};

module.exports = { protect };

// routes/status.routes.js
const express = require('express');
const router = express.Router();
const { getStatus } = require('../controllers/status.controller');

router.get('/', getStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { getCallHistory, createCallLog } = require('../controllers/call.controller');

router.use(protect);

router.get('/history', getCallHistory);
router.post('/log', createCallLog);

module.exports = router;

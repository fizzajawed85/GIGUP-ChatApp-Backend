const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
    getNotifications,
    markAllAsRead,
    clearAll
} = require('../controllers/notification.controller');

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.delete('/clear', clearAll);

module.exports = router;

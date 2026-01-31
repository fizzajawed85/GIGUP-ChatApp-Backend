const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const {
    sendGroupMessage,
    getGroupMessages,
    markMessageAsRead,
} = require("../controllers/groupMessage.controller");

// All routes require authentication
router.use(protect);

// Send message to group
router.post("/:id/message", sendGroupMessage);

// Get all messages for a group
router.get("/:id/messages", getGroupMessages);

// Mark message as read
router.put("/:id/message/:msgId/read", markMessageAsRead);

module.exports = router;

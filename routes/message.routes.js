const express = require("express");
const router = express.Router();
const protect = require("../middlewares/auth.middleware");
const {
  getMessagesByChat,
  sendMessage,
  clearChatHistory,
} = require("../controllers/message.controller");

// fetch messages for a chat
router.get("/:chatId", protect, getMessagesByChat);

// send message
router.post("/", protect, sendMessage);

// clear chat history (user-specific)
router.delete("/:chatId/clear", protect, clearChatHistory);

module.exports = router;

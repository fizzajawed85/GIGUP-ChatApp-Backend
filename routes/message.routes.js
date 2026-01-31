const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const {
  getMessagesByChat,
  sendMessage,
  clearChatHistory,
  editMessage,
  deleteMessage,
} = require("../controllers/message.controller");
const upload = require("../middlewares/upload.middleware");

// fetch messages for a chat
router.get("/:chatId", protect, getMessagesByChat);

// send message
router.post("/", protect, upload.single("file"), sendMessage);

// clear chat history (user-specific)
router.delete("/:chatId/clear", protect, clearChatHistory);

// edit message
router.put("/:messageId", protect, editMessage);

// delete message (POST used to allow body with deleteType)
router.post("/:messageId/delete", protect, deleteMessage);

module.exports = router;

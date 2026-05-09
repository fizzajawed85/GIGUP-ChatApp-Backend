const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const {
  createChatByEmail,
  getMyChats,
  getAiChat,
  markAsRead,
} = require("../controllers/chat.controller");

router.post("/create", protect, createChatByEmail);
router.get("/", protect, getMyChats);
router.get("/ai", protect, getAiChat);
router.post("/:chatId/read", protect, markAsRead);

module.exports = router;

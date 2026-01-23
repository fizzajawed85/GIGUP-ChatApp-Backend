const Message = require("../models/Message");
const Chat = require("../models/Chat");

//  Get Messages by ChatId (clearedBy aware)
exports.getMessagesByChat = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const loggedInUserId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (
      !chat ||
      !chat.participants.some((p) => p.toString() === loggedInUserId.toString())
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({
      chat: chatId,
      clearedBy: { $ne: loggedInUserId },
    })
      .sort({ createdAt: 1 })
      .populate("sender", "username email");

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

//  Send Message
exports.sendMessage = async (req, res, next) => {
  try {
    const { chatId, text } = req.body;
    const loggedInUserId = req.user._id;

    if (!text || !chatId) {
      return res.status(400).json({ message: "ChatId and text are required" });
    }

    const chat = await Chat.findById(chatId);
    if (
      !chat ||
      !chat.participants.some((p) => p.toString() === loggedInUserId.toString())
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const message = await Message.create({
      chat: chatId,
      sender: loggedInUserId,
      text,
      aiResponse: false,
    });

    chat.archivedBy = chat.archivedBy.filter(
      (id) => !chat.participants.includes(id)
    );

    chat.latestMessage = message._id;
    await chat.save();

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "username email"
    );

    res.status(201).json(populatedMessage);
  } catch (error) {
    next(error);
  }
};

//  Clear Chat History (user-specific)
exports.clearChatHistory = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const loggedInUserId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (
      !chat ||
      !chat.participants.some((p) => p.toString() === loggedInUserId.toString())
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Message.updateMany(
      { chat: chatId, clearedBy: { $ne: loggedInUserId } },
      { $push: { clearedBy: loggedInUserId } }
    );

    res.status(200).json({ message: "Chat cleared successfully" });
  } catch (error) {
    next(error);
  }
};

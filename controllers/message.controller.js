const Message = require("../models/Message");
const Chat = require("../models/Chat");
const Notification = require("../models/Notification");
const User = require("../models/User");

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

    if ((!text || !text.trim()) && !req.file) {
      return res.status(400).json({ message: "ChatId and text or file are required" });
    }

    let chat = await Chat.findById(chatId);
    if (
      !chat ||
      !chat.participants.some((p) => p.toString() === loggedInUserId.toString())
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    let fileUrl = "";
    let fileType = "";

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      if (req.file.mimetype.startsWith("image")) {
        fileType = "image";
      } else if (req.file.mimetype.startsWith("audio")) {
        fileType = "audio";
      } else {
        fileType = "video";
      }
    }

    const message = await Message.create({
      chat: chatId,
      sender: loggedInUserId,
      text: text || "",
      fileUrl,
      fileType,
      aiResponse: false,
    });

    // Ensure unreadCounts entries for all participants
    if (!chat.unreadCounts) chat.unreadCounts = [];

    chat.participants.forEach(pId => {
      const pIdStr = pId._id ? pId._id.toString() : pId.toString(); // Handle both populated and unpopulated participants
      if (!chat.unreadCounts.some(uc => uc.user.toString() === pIdStr)) {
        chat.unreadCounts.push({ user: pIdStr, count: 0 });
      }
    });

    // Increment unread counts for everyone EXCEPT the sender
    chat.unreadCounts.forEach(uc => {
      if (uc.user.toString() !== loggedInUserId.toString()) {
        uc.count += 1;
      }
    });

    chat.latestMessage = message._id;
    chat.archivedBy = [];
    await chat.save();

    // --- NOTIFICATION PERSISTENCE ---
    try {
      const sender = await User.findById(loggedInUserId);
      const recipients = chat.participants.filter(p => (p._id ? p._id.toString() : p.toString()) !== loggedInUserId.toString());

      for (const recipientId of recipients) {
        await Notification.create({
          recipient: recipientId,
          sender: loggedInUserId,
          type: 'message',
          title: `New Message from ${sender?.username || 'User'}`,
          content: text || (req.file ? 'Sent a file' : 'Sent an attachment'),
          data: { chatId, messageId: message._id }
        });
      }
    } catch (notifErr) {
      console.error(">>> Notification Persistence Error:", notifErr);
      // Don't throw, let the message proceed
    }

    // Populate for response/emission
    chat = await Chat.findById(chat._id)
      .populate("participants", "-password")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "username email avatar" },
      });

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "username email avatar"
    );

    // Socket Emissions
    const io = req.app.get("socketio");
    if (io) {
      io.to(chatId).emit("receiveMessage", populatedMessage);
      if (chat && chat.participants) {
        chat.participants.forEach(p => {
          const pId = p._id ? p._id.toString() : p.toString();
          io.to(pId).emit("chatUpdated", chat);
          io.to(pId).emit("receiveMessage", populatedMessage);
        });
      }
    }

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

//  Edit Message
exports.editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const loggedInUserId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== loggedInUserId.toString()) {
      return res.status(403).json({ message: "Unauthorized to edit this message" });
    }

    message.text = text;
    message.isEdited = true;
    await message.save();

    res.status(200).json(message);
  } catch (error) {
    next(error);
  }
};

//  Delete Message (Soft delete or user-specific clear)
exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { deleteType } = req.body; // 'forMe' or 'forEveryone'
    const loggedInUserId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (deleteType === "forEveryone") {
      if (message.sender.toString() !== loggedInUserId.toString()) {
        return res.status(403).json({ message: "Only the sender can delete for everyone" });
      }
      message.isDeleted = true;
      message.text = "🚫 This message was deleted";
      await message.save();
    } else {
      // Default: forMe
      if (!message.clearedBy.includes(loggedInUserId)) {
        message.clearedBy.push(loggedInUserId);
        await message.save();
      }
    }

    res.status(200).json(message);
  } catch (error) {
    next(error);
  }
};

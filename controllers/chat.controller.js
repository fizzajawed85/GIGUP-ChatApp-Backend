const Chat = require("../models/Chat");
const User = require("../models/User");


//  Add / Create Chat by Email (Human ↔ Human)
exports.createChatByEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const loggedInUserId = req.user._id;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // find user by email
    const userToChat = await User.findOne({ email });

    if (!userToChat) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userToChat._id.equals(loggedInUserId)) {
      return res.status(400).json({ message: "Cannot chat with yourself" });
    }

    // check if chat already exists
    let chat = await Chat.findOne({
      chatType: "user",
      participants: { $all: [loggedInUserId, userToChat._id] },
    })
      .populate("participants", "-password")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "username email" },
      });

    if (chat) {
      return res.status(200).json(chat);
    }

    // create new chat
    chat = await Chat.create({
      participants: [loggedInUserId, userToChat._id],
      chatType: "user",
    });

    chat = await Chat.findById(chat._id)
      .populate("participants", "-password");

    res.status(201).json(chat);
  } catch (error) {
    next(error);
  }
};

//  Get My Chats (Left Panel)

exports.getMyChats = async (req, res, next) => {
  try {
    const loggedInUserId = req.user._id;

    const chats = await Chat.find({
      participants: loggedInUserId,
    })
      .sort({ updatedAt: -1 })
      .populate("participants", "-password")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "username email" },
      });

    res.status(200).json(chats);
  } catch (error) {
    next(error);
  }
};

//  Get / Create AI Chat

exports.getAiChat = async (req, res, next) => {
  try {
    const loggedInUserId = req.user._id;

    const aiUser = await User.findOne({ role: "ai" });

    if (!aiUser) {
      return res.status(500).json({ message: "AI user not configured" });
    }

    let chat = await Chat.findOne({
      chatType: "ai",
      participants: { $all: [loggedInUserId, aiUser._id] },
    })
      .populate("participants", "-password")
      .populate("latestMessage");

    if (!chat) {
      chat = await Chat.create({
        participants: [loggedInUserId, aiUser._id],
        chatType: "ai",
      });

      chat = await Chat.findById(chat._id)
        .populate("participants", "-password");
    }

    res.status(200).json(chat);
  } catch (error) {
    next(error);
  }
};

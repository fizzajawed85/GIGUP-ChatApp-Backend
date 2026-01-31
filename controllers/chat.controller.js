const Chat = require("../models/Chat");
const User = require("../models/User");


//  Add / Create Chat by Email (Human ↔ Human)
exports.createChatByEmail = async (req, res, next) => {
  try {
    const { email, nickname } = req.body; // 'email' can be email or username
    const loggedInUserId = req.user._id;

    if (!email) {
      return res.status(400).json({ message: "Email or Username is required" });
    }

    // find user by email or username
    const userToChat = await User.findOne({
      $or: [{ email: email }, { username: email }],
    });

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
    });

    if (chat) {
      // If nickname provided, update it
      if (nickname) {
        const nickIndex = chat.nicknames.findIndex(n => n.user.toString() === loggedInUserId.toString());
        if (nickIndex !== -1) {
          chat.nicknames[nickIndex].name = nickname;
        } else {
          chat.nicknames.push({ user: loggedInUserId, name: nickname });
        }
        await chat.save();
      }

      chat = await Chat.findById(chat._id)
        .populate("participants", "-password")
        .populate({
          path: "latestMessage",
          populate: { path: "sender", select: "username email" },
        });

      return res.status(200).json(chat);
    }

    // create new chat
    chat = await Chat.create({
      participants: [loggedInUserId, userToChat._id],
      chatType: "user",
      nicknames: nickname ? [{ user: loggedInUserId, name: nickname }] : [],
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

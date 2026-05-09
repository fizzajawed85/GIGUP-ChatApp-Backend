const Chat = require("../models/Chat");
const User = require("../models/User");
const Message = require("../models/Message");


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

    let chats = await Chat.find({
      participants: loggedInUserId,
    })
      .sort({ updatedAt: -1 })
      .populate("participants", "-password")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "username email" },
      });

    // SELF-HEALING & SUPER RECONCILIATION: 
    const myIdStr = loggedInUserId.toString().toLowerCase();
    const mongoose = require("mongoose");

    for (let chat of chats) {
      if (!chat.unreadCounts) chat.unreadCounts = [];

      // 1. Ensure current user has an entry in unreadCounts
      let myUc = chat.unreadCounts.find(uc => uc.user && uc.user.toString().toLowerCase() === myIdStr);
      if (!myUc) {
        myUc = { user: loggedInUserId, count: 0 };
        chat.unreadCounts.push(myUc);
        chat.markModified('unreadCounts');
      }

      // 2. Determine ground truth count
      const latestSenderId = chat.latestMessage?.sender?._id || chat.latestMessage?.sender;
      const latestSenderIdStr = latestSenderId?.toString()?.toLowerCase();

      let actualUnreadCount = 0;
      // If there's no latest message, count is 0. If latest sender is us, count is 0.
      if (latestSenderIdStr && latestSenderIdStr !== myIdStr) {
        try {
          const cId = new mongoose.Types.ObjectId(chat._id);
          actualUnreadCount = await Message.countDocuments({
            chat: cId,
            sender: { $ne: loggedInUserId },
            status: { $in: ["sent", "delivered"] }
          });

          if (actualUnreadCount > 0) {
            console.log(`>>> Forensic: Chat ${chat._id} has ${actualUnreadCount} unread.`);
          }
        } catch (e) {
          console.error(">>> Reconciliation Query Error:", e);
        }
      }

      // 3. Synchronize DB counter
      if (myUc.count !== actualUnreadCount) {
        console.log(`>>> Reconciling chat ${chat._id}: DB count ${myUc.count} -> Actual ${actualUnreadCount}`);
        myUc.count = actualUnreadCount;
        chat.markModified('unreadCounts');
      }

      // 4. Save if changed
      if (chat.isModified('unreadCounts')) {
        await chat.save();
      }
    }

    res.status(200).json(chats);
  } catch (error) {
    next(error);
  }
};

//  Get / Create AI Chat

exports.getAiChat = async (req, res, next) => {
  try {
    const loggedInUserId = req.user._id;

    const aiUserEmail = process.env.AI_USER_EMAIL || "giga@system.local";
    let aiUser = await User.findOne({ role: "ai" });

    if (!aiUser) {
      aiUser = await User.findOne({ email: aiUserEmail });
    }

    if (!aiUser) {
      aiUser = await User.create({
        username: "Giga AI",
        email: aiUserEmail,
        password: "",
        role: "ai",
      });
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

// Mark all messages in chat as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    const mongoose = require("mongoose");
    const cId = new mongoose.Types.ObjectId(chatId);

    console.log(`>>> REST: markAsRead for chat ${chatId} by user ${userId}`);

    // 1. Mark messages as seen
    const updateRes = await Message.updateMany(
      { chat: cId, sender: { $ne: userId }, status: { $ne: "seen" } },
      { $set: { status: "seen" } }
    );
    console.log(`>>> REST: Marked ${updateRes.modifiedCount || updateRes.nModified || 0} messages as seen`);

    // 2. Reset unread counts
    const chat = await Chat.findById(chatId);
    if (chat && chat.unreadCounts) {
      const userIdStr = userId.toString().toLowerCase();
      const uc = chat.unreadCounts.find(u => u.user.toString().toLowerCase() === userIdStr);
      if (uc) {
        console.log(`>>> REST: Resetting count for ${userIdStr} from ${uc.count} to 0`);
        uc.count = 0;
        chat.markModified('unreadCounts');
        await chat.save();
      }
    }

    res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    next(error);
  }
};

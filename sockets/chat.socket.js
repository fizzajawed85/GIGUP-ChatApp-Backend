const Message = require("../models/Message");
const Chat = require("../models/Chat");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("New client connected: " + socket.id);

    socket.on("addUser", (userId) => {
      socket.join(userId);
    });

    socket.on("joinChat", async (chatId) => {
      socket.join(chatId);
    });

    // Updated sendMessage handler
    socket.on("sendMessage", async (data) => {
      console.log("SEND MESSAGE EVENT RECEIVED:", data);

      try {
        const { chatId, senderId, text } = data;

        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.some(p => p.toString() === senderId))
          return;

        const message = await Message.create({
          chat: chatId,
          sender: senderId,
          text,
          aiResponse: false,
        });

        chat.latestMessage = message._id;
        chat.archivedBy = [];
        await chat.save();

        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "username email");

        io.to(chatId).emit("receiveMessage", populatedMessage);
      } catch (error) {
        console.error("Socket sendMessage error:", error);
      }
    });
  });
};

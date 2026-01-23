const { Server } = require("socket.io");
const initChatSocket = require("./chat.socket");

const initSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  initChatSocket(io); // Chat logic delegated here
  console.log("WebSocket initialized");
};

module.exports = { initSockets };

const { Server } = require("socket.io");
const initChatSocket = require("./chat.socket");
const initGroupSocket = require("./group.socket");
const initCallSocket = require("./call.socket");

const initSockets = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  app.set("socketio", io);
  initChatSocket(io); // Chat logic
  initGroupSocket(io); // Group chat logic
  initCallSocket(io); // Calling logic
  require("./groupCall.socket")(io); // Group Calling logic
  console.log("WebSocket initialized");
};

module.exports = { initSockets };

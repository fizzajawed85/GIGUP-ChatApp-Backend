const { io } = require("socket.io-client");
const socket = io("http://localhost:5000"); // backend server URL

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  // Send test message
  socket.emit("sendMessage", { chatId: "test123", userId: "user001", message: "Hello AI!" });

  // Listen for messages in this chat
  socket.on("chat_test123", (data) => {
    console.log("Chat message received:", data);
  });

  // Typing indicator
  socket.emit("typing", { chatId: "test123", userId: "user001" });
});

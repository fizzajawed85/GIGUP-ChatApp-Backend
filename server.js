const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initSockets } = require('./sockets/index'); 

// Load env
dotenv.config();

// Connect MongoDB
connectDB();

// Express App
const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use("/api/message", require("./routes/message.routes"));


// Log middleware
app.use((req, res, next) => {
  console.log('Incoming Request:', req.method, req.url);
  next();
});

// HTTP + WebSocket server
const server = http.createServer(app);

// Initialize modular WebSocket
initSockets(server); 

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server + WebSocket running on port ${PORT}`);
});

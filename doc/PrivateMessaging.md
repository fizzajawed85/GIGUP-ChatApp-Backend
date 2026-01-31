# Private Messaging Documentation

## Overview
The Private Messaging module enables real-time, 1-on-1 communication between users. It supports text, media sharing, voice notes, and message status tracking (sent/delivered/seen).

## Features
- **Real-time Chat**: Messages are delivered instantly via WebSockets.
- **Media Support**: Upload and share images and videos.
- **Voice Messages**: Record and send audio notes directly from the chat window.
- **Message States**: Visual indicators for Sent, Delivered, and Seen (ticks).
- **Typing Indicators**: Real-time feedback when the other user is typing.
- **Editing & Deletion**: Support for editing messages and "Delete for Everyone" or "Delete for Me".

## Implementation Details

### Backend
- **Models**:
  - [Chat.js](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/backend/models/Chat.js): Stores conversation metadata and participants.
  - [Message.js](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/backend/models/Message.js): Stores individual message content, file URLs, and delivery status.
- **Sockets**: [chat.socket.js](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/backend/sockets/chat.socket.js) handles events like `sendMessage`, `typing`, `messageSeen`, and `receiveMessage`.

### Frontend
- **Components**:
  - `ChatWindow.jsx`: The main messaging interface.
  - `MessageItem.jsx`: Individual message bubble with status icons.
  - `ChatSidebar.jsx`: List of recent active conversations.
- **Redux**: `chatSlice.js` and `messageSlice.js` manage global chat state.

### Technical Flow
1. **Initiation**: User selects a contact; frontend checks for existing `Chat` ID or creates a new one.
2. **Sending**:
   - `socket.emit("sendMessage", data)` sends message details.
   - Backend saves to DB and broadcasts back to participants.
3. **Receipt**: `socket.on("receiveMessage")` updates the UI and automatically triggers a `seen` event if the chat is open.

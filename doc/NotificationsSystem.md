# Notification System (Live Signals) Documentation

## Overview
GIGUP features a persistent notification system called "Live Signals" that keeps users informed of all platform activity, even when they are offline or in different tabs.

## Features
- **Persistent Storage**: Notifications are saved in the database and fetched on login/refresh.
- **Live Delivery**: Real-time delivery via WebSockets for active sessions.
- **Multilingual Types**:
  - `Message`: New private chats.
  - `Call`: Incoming audio/video calls.
  - `Group`: Group activity and group messages.
  - `AI`: Responses from Giga AI.
  - `System`: Account or platform updates.
- **Unread Tracking**: Visual "unread" indicators (red badges) on the Navbar and Sidebar.

## Implementation Details

### Backend
- **Model**: [Notification.js](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/backend/models/Notification.js) tracks recipient, sender, type, title, and read status.
- **Persistence Logic**: Backend controllers (Message, Call, Group, AI) automatically trigger a database save and a socket signal whenever a notifying event occurs.

### Frontend
- **Context**: [NotificationContext.jsx](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/frontend/src/context/NotificationContext.jsx) acts as the global state for fetching and managing notification lists.
- **Sidebar**: `NotificationSidebar.jsx` provides the slide-out interface (Live Signals) to manage historical notifications.

### Logic Flow
1. **Event**: User A sends a message to User B.
2. **Backend**:
   - Saves Message to DB.
   - Saves Notification record to DB.
   - Emits `receiveMessage` via socket.
3. **Frontend (User B)**:
   - `NotificationContext` listens for socket signals.
   - Updates `unreadCount` and adds the item to the list instantly.
   - On page refresh, it fetches the saved record from `/api/notifications`.

# GIGUP Platform Technical Documentation

Welcome to the internal documentation for **GIGUP**, a premium, next-generation social communication platform. This hub provides detailed implementation guides for every major feature of the application.

## Documentation Modules

Explore the technical architecture and implementation details for each feature:

1.  **[Authentication System](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/doc/Authentication.md)**
    *   JWT-based security, Registration, Login, and OTP Recovery.
2.  **[Private Messaging](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/doc/PrivateMessaging.md)**
    *   Real-time 1-on-1 chats, Media sharing, and Voice Messages.
3.  **[Group Chat](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/doc/GroupChat.md)**
    *   Group rooms, Admin management, and Scalable broadcasting.
4.  **[Giga AI Assistant](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/doc/GigaAI.md)**
    *   Multimodal AI (Gemini 2.5 Flash), Vision analysis, and Conversational memory.
5.  **[Calling System](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/doc/CallingSystem.md)**
    *   WebRTC Audio/Video calls (1-on-1 & Group) and Signaling logic.
6.  **[Notification System](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/doc/NotificationsSystem.md)**
    *   Live Signals, Persistent event storage, and Real-time syncing.
7.  **[Updates & Moments](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/doc/UpdatesAndStatus.md)**
    *   Ephemeral updates (Status), Text & Media sharing.
8.  **[User Profile & Settings](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/doc/UserProfileAndSettings.md)**
    *   Identity management, Avatar uploads, and Theme control.

---

## Technical Stack Overview

### Backend
- **Core**: Node.js & Express.
- **Database**: MongoDB with Mongoose ODM.
- **Real-time**: Socket.io for all live events.
- **AI**: Google Generative AI (Gemini SDK).

### Frontend
- **Framework**: React.js with Vite.
- **State Management**: Redux Toolkit & React Context API.
- **Aesthetics**: Vanilla CSS (Premium Micro-interactions).
- **Media**: Simple-Peer for WebRTC.

---

## 🚀 How to Run the Project

Aapko do alag terminals open karne honge backend aur frontend run karne ke liye.

### 1. Backend Setup
```powershell
cd backend
npm install
npm run dev
```

### 2. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```

---
*Developed by Jawan Pakistan - Module B Capstone Project.*

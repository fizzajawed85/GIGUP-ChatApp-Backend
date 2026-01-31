# Calling System (Audio & Video) Documentation

## Overview
GIGUP provides crystal-clear Audio and Video calling functionality directly in the browser using WebRTC technology.

## Features
- **1-on-1 Calls**: Direct peer-to-peer signaling for private calls.
- **Group Calling**: Multi-party rooms where multiple group members can join.
- **Dynamic Switching**: Switch between Audio and Video modes seamlessly.
- **Call History**: Persistent logging of every call outcome (Answered, Missed, Declined).

## Implementation Details

### Technology Stack
- **WebRTC**: For peer-to-peer media streaming.
- **Simple-Peer**: Library used to abstract WebRTC handshake and signaling.
- **Socket.io**: Acts as the signaling server to exchange ICE candidates and SDP offers/answers.

### Frontend Logic
- **Context**: [CallingContext.jsx](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/frontend/src/context/CallingContext.jsx) manages global call state (ringing, active, streams).
- **Emissions**: Uses `callUser`, `answerCall`, and `leaveCall` events.

### Backend Handlers
- **Sockets**: [call.socket.js](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/backend/sockets/call.socket.js) relays signaling data between users.
- **Logging**: [call.controller.js](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/backend/controllers/call.controller.js) records call metadata (caller, receiver, duration, status) at the end of each session.

### Execution Flow
1. **Initiate**: Caller generates an "Offer" via Simple-Peer and sends it via socket.
2. **Signal**: Receiver hears a "ring" (IncomingCallModal) and generates an "Answer".
3. **Connect**: Both parties exchange ICE candidates until a direct media link is established.
4. **Log**: Upon hangup, the initiator side sends a log request to the database.

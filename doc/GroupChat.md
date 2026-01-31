# Group Chat Documentation

## Overview
GIGUP supports dynamic group collaborations, allowing users to create rooms, manage members, and communicate collectively.

## Features
- **Group Creation**: Create groups with custom names, descriptions, and avatars.
- **Member Management**: Admins can add or remove members and promote others to admin.
- **System Notifications**: Automated messages when members are added or groups are updated.
- **Unread Counts**: Per-user unread counters for each group.
- **Media Sharing**: Full support for images and videos in group contexts.

## Implementation Details

### Backend
- **Models**:
  - [Group.js](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/backend/models/Group.js): Stores members, admins, and unread count arrays.
  - [GroupMessage.js](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/backend/models/GroupMessage.js): Linked to group IDs instead of private chats.
- **Sockets**: [group.socket.js](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/backend/sockets/group.socket.js) handles real-time delivery to group specific rooms (e.g., `group_ID`).

### Frontend
- **Pages**:
  - `Groups.jsx`: Displays active groups and handles group selection.
- **Components**:
  - `CreateGroupModal.jsx`: Interface for group setup.
  - `GroupInfoSidebar.jsx`: Member list and admin settings.
- **Logic**: Uses `socket.join("group_" + id)` on the backend to facilitate broadcasting to all members simultaneously.

### Security
- Only members can fetch messages from a group room.
- Only admins can perform destructive actions like removing members.

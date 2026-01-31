# Updates (Status/Stories) Documentation

## Overview
The "Updates" feature (formerly Status) allows users to share ephemeral moments—text or media—with their contacts.

## Features
- **My Updates**: Create and view your own shared moments.
- **Media Updates**: Upload images or videos with custom captions.
- **Text Updates**: Share purely textual updates with colorful backgrounds.
- **Auto-Expiry**: (Conceptual/Implementation Detail) Updates are typically time-bound.

## Implementation Details

### Backend
- **Model**: [Status.js](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/backend/models/Status.js) stores creator ID, content URL, and type.
- **Routes**: `backend/routes/status.routes.js` handles CRUD operations for updates.

### Frontend
- **Page**: `UpdatesTab.jsx` is the primary hub for viewing updates.
- **Components**:
  - `StatusCreator.jsx`: Multi-step UI for creating text or media updates.
  - `StatusViewer.jsx`: A full-screen overlay for viewing shared updates.
  - `UpdatesSidebar.jsx`: Navigation for my updates and recent updates from others.

### Naming Convention
Originally called "Status", this feature was rebranded to "Updates" across the entire codebase (Routes, UI labels, and Sidebar icons) for a more modern experience.

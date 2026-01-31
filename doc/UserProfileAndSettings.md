# User Profile & Settings Documentation

## Overview
GIGUP provides comprehensive customization options for users to manage their identity and app experience.

## Features
- **Profile Customization**: Update username, bio, and upload high-resolution avatars.
- **Theme Management**: Support for Light and Dark modes with a theme-aware UI.
- **Account Security**: Password management and logout functionality.
- **Visual Branding**: Premium design aesthetics integrated into profile views.

## Implementation Details

### Backend
- **Models**: Built-in fields in [User.js](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/backend/models/User.js).
- **Controllers**: `user.controller.js` handles profile updates and avatar uploads using `multer`.

### Frontend
- **Pages**:
  - `Profile.jsx`: View and edit personal information.
  - `Settings.jsx`: Toggle theme, manage account privacy, and configure app preferences.
- **State**: The `auth` state is updated locally whenever profile changes are saved to the server.

### Design System
GIGUP uses a curated utility-first design system. Colors and components automatically adjust based on the `theme` context, ensuring a comfortable viewing experience in both night (Dark) and day (Light) modes.

# Authentication System Documentation

## Overview
GIGUP uses a robust JWT-based authentication system to manage user identity and secure resources. It includes registration, login, password recovery, and OTP verification.

## Features
- **User Registration**: Secure account creation with email and password.
- **Login**: Token-based authentication using JSON Web Tokens (JWT).
- **Password Recovery**: Support for "Forgot Password" via email-linked OTP.
- **OTP Verification**: Secure verification layer for sensitive actions.
- **Account Switching**: Support for multiple account sessions stored in `localStorage`.

## Implementation Details

### Backend
- **Models**: [User.js](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/backend/models/User.js) stores credentials, bio, and avatar.
- **Middleware**: [auth.middleware.js](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/backend/middlewares/auth.middleware.js) protects routes using the `protect` function.
- **Routes**: Located in `backend/routes/auth.routes.js`.

### Frontend
- **State Management**: Uses a custom `auth` object stored in `localStorage` containing the user profile and JWT token.
- **Pages**:
  - `Login.jsx`: Handles user authentication.
  - `Register.jsx`: Handles new user signups.
  - `VerifyOtp.jsx`: Validates one-time passwords.
  - `ResetPassword.jsx`: Allows users to set new passwords after verification.

### Logic Flow
1. User provides credentials to `/api/auth/login`.
2. Backend validates via `bcrypt` and returns a JWT.
3. Frontend stores JWT and user data.
4. Subsequent requests include the JWT in the `Authorization` header.

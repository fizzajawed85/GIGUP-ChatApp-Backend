# Giga AI (Multimodal Assistant) Documentation

## Overview
Giga is an advanced, multimodal AI assistant integrated into GIGUP. It allows users to chat, analyze images, and process voice messages using the Gemini 2.5 Flash model.

## Features
- **Conversational AI**: Persistent chat history with memory.
- **Vision Analysis**: Upload images for Giga to describe or analyze.
- **Voice Recognition**: Send voice notes; Giga "listens" and responds.
- **Identity Awareness**: Giga knows it is part of GIGUP and provides premium platform assistance.

## Implementation Details

### Backend
- **Models**:
  - [AIConversation.js](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/backend/models/AIConversation.js): Stores session titles and metadata.
  - [AIMessage.js](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/backend/models/AIMessage.js): Stores user prompts and AI responses.
- **Gemini Integration**: [ai.controller.js](file:///d:/Jawan_Pakistan/Module_B/Assignments/Projects/Chat_App/backend/controllers/ai.controller.js) interfaces with `@google/generative-ai`.
- **System Prompt**: Defines "Giga" as a premium GIGUP assistant with knowledge of all app features.

### Frontend
- **Page**: `AIChat.jsx` provides a specialized interface for AI interaction.
- **Identity UI**: Distinct styling to differentiate AI chats from human conversations.

### Multimodal Logic
1. User sends text/image/audio.
2. Backend reads file buffers and sanitizes MimeTypes (for Gemini compatibility).
3. Data is sent to the `gemini-2.5-flash` model.
4. Response is saved and a notification signal is emitted to the UI.

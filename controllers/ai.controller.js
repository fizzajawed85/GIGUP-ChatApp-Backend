const { GoogleGenerativeAI } = require("@google/generative-ai");
const AIConversation = require("../models/AIConversation");
const AIMessage = require("../models/AIMessage");
const Notification = require("../models/Notification");
const fs = require("fs");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Send message to Giga (fka Jaxon)
exports.chatWithGiga = async (req, res, next) => {
    try {
        console.log(">>> Giga Chat Request Received");
        const { text, conversationId } = req.body;
        const userId = req.user._id;
        const file = req.file;

        console.log(">>> Giga Chat Payload:", { text, conversationId, hasFile: !!file });
        if (file) console.log(">>> File Details:", { filename: file.filename, mimetype: file.mimetype, path: file.path });

        if (!text && !file) {
            return res.status(400).json({ message: "Message text or file is required" });
        }

        let conversation;
        if (conversationId) {
            conversation = await AIConversation.findOne({ _id: conversationId, user: userId });
            if (!conversation) {
                return res.status(404).json({ message: "Conversation not found" });
            }
        } else {
            const initialTitle = text ? (text.substring(0, 30) + (text.length > 30 ? "..." : "")) : "Media Analysis Session";
            conversation = await AIConversation.create({
                user: userId,
                title: initialTitle,
            });
        }

        // 1. Save User Message
        const userMsg = await AIMessage.create({
            conversation: conversation._id,
            role: "user",
            text: text || "[Media File]",
            fileUrl: file ? `/uploads/${file.filename}` : null,
            fileType: file ? (file.mimetype.startsWith("image") ? "image" : file.mimetype.startsWith("audio") ? "audio" : "video") : null,
        });

        // 2. Get History
        const history = await AIMessage.find({ conversation: conversation._id })
            .sort({ createdAt: 1 })
            .limit(20);

        // 3. Prepare AI
        // Using gemini-2.5-flash with the full Giga identity
        console.log(">>> Gemini Init: gemini-2.5-flash (Giga Identity)");
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `You are Giga, the heart and soul of GIGUP — a premium, next-generation social communication platform.
            
GIGUP Purpose: To provide a seamless, high-speed, and feature-rich environment for private chats, group coordination, and AI-powered interactions.
GIGA Identity: You are not just a chatbot; you are a visionary assistant. You are helpful, premium, and deeply integrated into GIGUP's ecosystem.
Features of GIGUP you know: 
- Real-time 1-on-1 and Group Chat.
- Crystal clear Audio and Video calling (WebRTC).
- Multimodal AI Analysis (Vision, Audio, Text).
- Notifications, Settings (Light/Dark mode), and Searchable Contacts.

Your goal is to assist users with their queries, analyze their media (images/audio), and embody the premium vibe of the GIGUP app. If a user asks who you are or what this app is, explain Giga and GIGUP with pride.`
        });

        const chatHistory = history.map(msg => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text || "" }],
        }));
        console.log(`>>> History mapped: ${chatHistory.length} messages`);
        chatHistory.pop();

        let promptParts = [{ text: text || (file && file.mimetype.startsWith("audio") ? "Listen to this voice message and respond." : "Analyze this media.") }];

        if (file) {
            try {
                if (fs.existsSync(file.path)) {
                    console.log(">>> File exists, reading...");
                    const fileBuffer = fs.readFileSync(file.path);
                    console.log(`>>> File read success: ${fileBuffer.length} bytes`);
                    // Sanitize mimetype (Gemini SDK doesn't like parameters like ;codecs=opus)
                    const cleanMimeType = file.mimetype.split(";")[0];
                    promptParts.push({
                        inlineData: {
                            data: fileBuffer.toString("base64"),
                            mimeType: cleanMimeType,
                        },
                    });
                } else {
                    console.error(">>> File missing at path:", file.path);
                }
            } catch (fsError) {
                console.error(">>> File Read Error:", fsError);
                // Continue without file rather than crashing
                promptParts[0].text += " [Error: Attached file could not be read]";
            }
        }
        console.log(">>> Final Prompt Parts:", JSON.stringify(promptParts).substring(0, 200) + "...");

        let aiText = "Thinking...";
        try {
            const chat = model.startChat({
                history: chatHistory,
            });
            const result = await chat.sendMessage(promptParts);
            const response = await result.response;
            aiText = response.text();
            console.log(">>> Gemini Response Success");
        } catch (apiError) {
            console.error(">>> Gemini API Error:", apiError);
            aiText = `[Error] I couldn't process that. API Error: ${apiError.message}`;

            // Generic hints based on error codes
            if (apiError.message.includes("404")) {
                aiText += "\n(Hint: High-capacity AI model is currently unavailable in this project.)";
            } else if (apiError.message.includes("429")) {
                aiText += "\n(Hint: DAILY/MINUTELY QUOTA EXCEEDED. Please wait or try a different key.)";
            }
        }

        // 4. Save AI Message
        const aiMsg = await AIMessage.create({
            conversation: conversation._id,
            role: "model",
            text: aiText,
        });

        conversation.lastMessage = aiText.substring(0, 50);
        await conversation.save();

        // Create notification for AI reply
        await Notification.create({
            recipient: userId,
            type: 'ai',
            title: 'Giga AI Response',
            content: 'Giga has finished thinking about your request.',
            data: { conversationId: conversation._id, messageId: aiMsg._id }
        });

        console.log(">>> AI Messages Saved Success. Role:", aiMsg.role, "Text Length:", aiText.length);

        res.status(200).json({
            conversation,
            userMessage: userMsg,
            aiMessage: aiMsg
        });

    } catch (error) {
        console.error(">>> Critical Controller Error:", error);
        // Ensure we send a JSON response even on crash, so server doesn't hang client
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Get all conversations for a user
exports.getConversations = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const conversations = await AIConversation.find({ user: userId }).sort({ updatedAt: -1 });
        res.json(conversations);
    } catch (error) {
        next(error);
    }
};

// Get messages for a conversation
exports.getMessages = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const conversation = await AIConversation.findOne({ _id: id, user: userId });
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const messages = await AIMessage.find({ conversation: id }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        next(error);
    }
};

// Delete a conversation
exports.deleteConversation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const conversation = await AIConversation.findOneAndDelete({ _id: id, user: userId });
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        // Also delete related messages
        await AIMessage.deleteMany({ conversation: id });

        res.json({ message: "Conversation deleted successfully" });
    } catch (error) {
        next(error);
    }
};

// Rename a conversation
exports.renameConversation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const userId = req.user._id;

        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }

        const conversation = await AIConversation.findOneAndUpdate(
            { _id: id, user: userId },
            { title },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        res.json(conversation);
    } catch (error) {
        next(error);
    }
};

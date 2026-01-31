const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");
const {
    createGroup,
    getGroups,
    getGroupById,
    updateGroup,
    leaveGroup,
    addMembers,
    removeMember,
} = require("../controllers/group.controller");
const {
    sendGroupMessage,
    getGroupMessages,
    markMessageAsRead,
} = require("../controllers/groupMessage.controller");

// All routes require authentication
router.use(protect);

// Create new group (with optional avatar upload)
router.post("/", upload.single("groupAvatar"), createGroup);

// Get all groups for current user
router.get("/", getGroups);

// Get specific group details
router.get("/:id", getGroupById);

// Update group (admin only, with optional avatar upload)
router.put("/:id", upload.single("groupAvatar"), updateGroup);

// Leave group
router.post("/:id/leave", leaveGroup);

// Add members to group (admin only)
router.post("/:id/add-members", addMembers);

// Remove member from group (admin only)
router.post("/:id/remove-member", removeMember);

// Send message to group
router.post("/:id/message", upload.single("file"), sendGroupMessage);

// Get all messages for a group
router.get("/:id/messages", getGroupMessages);

// Mark message as read
router.put("/:id/message/:msgId/read", markMessageAsRead);

module.exports = router;

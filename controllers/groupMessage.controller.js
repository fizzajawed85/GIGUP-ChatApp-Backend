const GroupMessage = require("../models/GroupMessage");
const Group = require("../models/Group");
const Notification = require("../models/Notification");

// Send message to group
exports.sendGroupMessage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const userId = req.user._id;

        if ((!text || !text.trim()) && !req.file) {
            return res.status(400).json({ message: "Message text or file is required" });
        }

        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is a member
        if (!group.members.some(m => m.toString() === userId.toString())) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        let fileUrl = "";
        let fileType = "";

        if (req.file) {
            fileUrl = `/uploads/${req.file.filename}`;
            fileType = req.file.mimetype.startsWith("image") ? "image" : "video";
        }

        const newMessage = await GroupMessage.create({
            group: id,
            sender: userId,
            text: text || "",
            fileUrl,
            fileType,
            readBy: [userId],
            status: "sent",
        });

        // Update group's latest message
        group.latestMessage = newMessage._id;

        // Increment unread count for all members except sender
        group.unreadCounts.forEach(uc => {
            if (uc.user.toString() !== userId.toString()) {
                uc.count += 1;
            }
        });

        await group.save();

        // Create notifications for all members except sender
        try {
            for (const memberId of group.members) {
                if (memberId.toString() !== userId.toString()) {
                    await Notification.create({
                        recipient: memberId,
                        sender: userId,
                        type: 'group',
                        title: `Group: ${group.name}`,
                        content: `${req.user.username}: ${text || (req.file ? 'Sent a file' : '')}`,
                        data: { groupId: id, messageId: newMessage._id }
                    });
                }
            }
        } catch (notifErr) {
            console.error(">>> Group Notification Error:", notifErr);
        }

        const populated = await GroupMessage.findById(newMessage._id)
            .populate("sender", "username avatar");

        // Emit to all members via socket
        const io = req.app.get("socketio");
        if (io) {
            io.to(`group_${id}`).emit("groupMessage", populated);
        }

        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

// Get all messages for a group
exports.getGroupMessages = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is a member
        if (!group.members.some(m => m.toString() === userId.toString())) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        const messages = await GroupMessage.find({ group: id })
            .populate("sender", "username avatar")
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        next(error);
    }
};

// Mark all messages in group as read by user
exports.markMessageAsRead = async (req, res, next) => {
    try {
        const { id } = req.params; // groupId
        const userId = req.user._id;

        // 1. Update all messages in this group where user is NOT in readBy
        await GroupMessage.updateMany(
            { group: id, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );

        // 2. Reset unread count for this user in the Group model
        const group = await Group.findById(id);
        if (group) {
            const userCount = group.unreadCounts.find(uc => uc.user.toString() === userId.toString());
            if (userCount) {
                userCount.count = 0;
                await group.save();
            }
        }

        // 3. Notify group members via socket (Bulk Update)
        const io = req.app.get("socketio");
        if (io) {
            io.to(`group_${id}`).emit("groupAllMessagesRead", {
                groupId: id,
                userId: userId
            });
        }

        res.json({ message: "Marked all messages as read" });
    } catch (error) {
        next(error);
    }
};

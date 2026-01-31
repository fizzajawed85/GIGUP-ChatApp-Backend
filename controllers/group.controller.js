const Group = require("../models/Group");
const GroupMessage = require("../models/GroupMessage");
const Notification = require("../models/Notification");

// Create new group
exports.createGroup = async (req, res, next) => {
    try {
        const { name, description, members } = req.body;
        const userId = req.user._id;

        if (!name || !members || members.length === 0) {
            return res.status(400).json({ message: "Name and members are required" });
        }

        // Add creator to members if not already included
        const memberIds = [...new Set([userId.toString(), ...members])];

        let avatar = "";
        if (req.file) {
            avatar = `/uploads/${req.file.filename}`;
        }

        const newGroup = await Group.create({
            name,
            description: description || "",
            avatar,
            members: memberIds,
            admins: [userId],
            createdBy: userId,
            unreadCounts: memberIds.map(id => ({ user: id, count: 0 })),
        });

        // Create notification for all members except creator
        try {
            for (const memberId of memberIds) {
                if (memberId.toString() !== userId.toString()) {
                    await Notification.create({
                        recipient: memberId,
                        sender: userId,
                        type: 'system',
                        title: 'New Group Created',
                        content: `You've been added to "${name}"`,
                        data: { groupId: newGroup._id }
                    });
                }
            }
        } catch (notifErr) {
            console.error(">>> Group Create Notification Error:", notifErr);
        }

        const populated = await Group.findById(newGroup._id)
            .populate("members", "username avatar")
            .populate("admins", "username avatar")
            .populate("createdBy", "username avatar");

        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

// Get all groups for current user
exports.getGroups = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const groups = await Group.find({ members: userId })
            .populate("members", "username avatar")
            .populate("latestMessage")
            .sort({ updatedAt: -1 });

        res.json(groups);
    } catch (error) {
        next(error);
    }
};

// Get specific group details
exports.getGroupById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(id)
            .populate("members", "username avatar")
            .populate("admins", "username avatar")
            .populate("createdBy", "username avatar");

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is a member
        if (!group.members.some(m => m._id.toString() === userId.toString())) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        res.json(group);
    } catch (error) {
        next(error);
    }
};

// Update group (name, avatar, description)
exports.updateGroup = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is admin
        if (!group.admins.some(a => a.toString() === userId.toString())) {
            return res.status(403).json({ message: "Only admins can update group" });
        }

        if (name) group.name = name;
        if (description !== undefined) group.description = description;
        if (req.file) {
            group.avatar = `/uploads/${req.file.filename}`;
        }

        await group.save();

        const updated = await Group.findById(id)
            .populate("members", "username avatar")
            .populate("admins", "username avatar");

        res.json(updated);
    } catch (error) {
        next(error);
    }
};

// Leave group
exports.leaveGroup = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Remove user from members
        group.members = group.members.filter(m => m.toString() !== userId.toString());
        group.admins = group.admins.filter(a => a.toString() !== userId.toString());
        group.unreadCounts = group.unreadCounts.filter(u => u.user.toString() !== userId.toString());

        // If no members left, delete group
        if (group.members.length === 0) {
            await Group.findByIdAndDelete(id);
            await GroupMessage.deleteMany({ group: id });
            return res.json({ message: "Group deleted (no members left)" });
        }

        // If creator left and no admins, make first member admin
        if (group.admins.length === 0 && group.members.length > 0) {
            group.admins.push(group.members[0]);
        }

        await group.save();
        res.json({ message: "Left group successfully" });
    } catch (error) {
        next(error);
    }
};

// Add members to group (admin only)
exports.addMembers = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { memberIds } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is admin
        if (!group.admins.some(a => a.toString() === userId.toString())) {
            return res.status(403).json({ message: "Only admins can add members" });
        }

        // Add new members
        memberIds.forEach(memberId => {
            if (!group.members.some(m => m.toString() === memberId)) {
                group.members.push(memberId);
                group.unreadCounts.push({ user: memberId, count: 0 });
            }
        });

        await group.save();

        // Create notification for added members
        try {
            for (const memberId of memberIds) {
                await Notification.create({
                    recipient: memberId,
                    sender: userId,
                    type: 'system',
                    title: 'Added to Group',
                    content: `You've been added to "${group.name}"`,
                    data: { groupId: group._id }
                });
            }
        } catch (notifErr) {
            console.error(">>> Group Add Notification Error:", notifErr);
        }

        const io = req.app.get("socketio");
        if (io) {
            memberIds.forEach(mId => {
                io.to(mId).emit("addedToGroup", {
                    groupId: group._id,
                    groupName: group.name,
                    addedBy: userId
                });
            });
        }

        const updated = await Group.findById(id).populate("members", "username avatar");
        res.json(updated);
    } catch (error) {
        next(error);
    }
};

// Remove member from group (admin only)
exports.removeMember = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { memberId } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is admin
        if (!group.admins.some(a => a.toString() === userId.toString())) {
            return res.status(403).json({ message: "Only admins can remove members" });
        }

        // Cannot remove creator
        if (group.createdBy.toString() === memberId) {
            return res.status(400).json({ message: "Cannot remove group creator" });
        }

        group.members = group.members.filter(m => m.toString() !== memberId);
        group.admins = group.admins.filter(a => a.toString() !== memberId);
        group.unreadCounts = group.unreadCounts.filter(u => u.user.toString() !== memberId);

        await group.save();

        const updated = await Group.findById(id).populate("members", "username avatar");
        res.json(updated);
    } catch (error) {
        next(error);
    }
};

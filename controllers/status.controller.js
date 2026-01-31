const Status = require("../models/Status");

// Create Status
exports.createStatus = async (req, res, next) => {
    try {
        let { content, type, backgroundColor } = req.body;
        const userId = req.user._id;

        if (req.file) {
            content = `/uploads/${req.file.filename}`;
            type = req.file.mimetype.startsWith("video") ? "video" : "image";
        }

        const newStatus = await Status.create({
            user: userId,
            content,
            type,
            backgroundColor,
        });

        const populated = await Status.findById(newStatus._id).populate("user", "username avatar");
        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

// Get Status Feed
exports.getStatusFeed = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Fetch all active statuses
        // In a real app, you might filter by user's contacts
        const statuses = await Status.find({
            expiresAt: { $gt: new Date() },
        })
            .sort({ createdAt: -1 })
            .populate("user", "username avatar");

        res.status(200).json(statuses);
    } catch (error) {
        next(error);
    }
};

// Mark View
exports.markStatusViewed = async (req, res, next) => {
    try {
        const { statusId } = req.params;
        const userId = req.user._id;

        const status = await Status.findById(statusId);
        if (!status) return res.status(404).json({ message: "Status not found" });

        if (!status.viewers.includes(userId)) {
            status.viewers.push(userId);
            await status.save();
        }

        res.status(200).json(status);
    } catch (error) {
        next(error);
    }
};

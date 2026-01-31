const Notification = require('../models/Notification');

// Get all notifications for current user
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .populate('sender', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, read: false },
            { read: true }
        );
        res.json({ message: "Marked all as read" });
    } catch (err) {
        res.status(500).json({ message: "Failed to mark as read" });
    }
};

// Delete all notifications for current user
exports.clearAll = async (req, res) => {
    try {
        await Notification.deleteMany({ recipient: req.user.id });
        res.json({ message: "Cleared all notifications" });
    } catch (err) {
        res.status(500).json({ message: "Failed to clear notifications" });
    }
};

// Helper function to create notification (internal)
exports.createInternalNotification = async (data) => {
    try {
        const notification = await Notification.create(data);
        return notification;
    } catch (err) {
        console.error("Internal Notification Error:", err);
    }
};

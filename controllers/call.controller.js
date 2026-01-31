const Call = require('../models/Call');

// Get Call History for Logged-in User
exports.getCallHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const calls = await Call.find({
            $or: [{ caller: userId }, { receiver: userId }]
        })
            .populate('caller', 'username avatar')
            .populate('receiver', 'username avatar')
            .sort({ createdAt: -1 });

        res.json(calls);
    } catch (err) {
        console.error("Error fetching call history:", err);
        res.status(500).json({ message: "Failed to fetch call history" });
    }
};

// Create Call Log (Internal use for now)
exports.createCallLog = async (req, res) => {
    try {
        const { receiverId, type, status, duration } = req.body;
        const call = await Call.create({
            caller: req.user.id,
            receiver: receiverId,
            type,
            status,
            duration
        });
        res.status(201).json(call);
    } catch (err) {
        res.status(500).json({ message: "Failed to create call log" });
    }
};

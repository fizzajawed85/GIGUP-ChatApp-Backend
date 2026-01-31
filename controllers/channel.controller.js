const Channel = require("../models/Channel");
const ChannelUpdate = require("../models/ChannelUpdate");

// Create Channel
exports.createChannel = async (req, res, next) => {
    try {
        let { name, description, avatar } = req.body;
        const userId = req.user._id;

        if (req.file) {
            avatar = `/uploads/${req.file.filename}`;
        }

        const channel = await Channel.create({
            name,
            description,
            owner: userId,
            avatar,
            followers: [userId], // Owner follows by default
        });

        res.status(201).json(channel);
    } catch (error) {
        next(error);
    }
};

// Get Channels
exports.getChannels = async (req, res, next) => {
    try {
        const channels = await Channel.find().populate("owner", "username avatar");
        res.status(200).json(channels);
    } catch (error) {
        next(error);
    }
};

// Join Channel
exports.joinChannel = async (req, res, next) => {
    try {
        const { channelId } = req.params;
        const userId = req.user._id;

        const channel = await Channel.findById(channelId);
        if (!channel) return res.status(404).json({ message: "Channel not found" });

        if (!channel.followers.includes(userId)) {
            channel.followers.push(userId);
            await channel.save();
        }

        res.status(200).json(channel);
    } catch (error) {
        next(error);
    }
};

// Post Update
exports.postChannelUpdate = async (req, res, next) => {
    try {
        const { channelId } = req.params;
        let { text, image } = req.body;
        const userId = req.user._id;

        const channel = await Channel.findById(channelId);
        if (!channel) return res.status(404).json({ message: "Channel not found" });

        if (channel.owner.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Only the owner can post updates" });
        }

        let mediaUrl = "";
        let mediaType = "text";

        if (req.file) {
            mediaUrl = `/uploads/${req.file.filename}`;
            mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
        }

        const update = await ChannelUpdate.create({
            channel: channelId,
            sender: userId,
            text,
            mediaUrl,
            mediaType,
        });

        res.status(201).json(update);
    } catch (error) {
        next(error);
    }
};

// Get Updates
exports.getChannelUpdates = async (req, res, next) => {
    try {
        const { channelId } = req.params;
        const updates = await ChannelUpdate.find({ channel: channelId })
            .sort({ createdAt: 1 })
            .populate("sender", "username avatar");

        res.status(200).json(updates);
    } catch (error) {
        next(error);
    }
};

const User = require('../models/User');

// Get User Profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Get All Users (for Contacts)
exports.getAllUsers = async (req, res) => {
    try {
        const loggedInUserId = req.user.id;
        // Fetch all users except the current user
        const users = await User.find({ _id: { $ne: loggedInUserId } })
            .select('username email avatar about status isOnline lastSeen');
        res.json(users);
    } catch (err) {
        console.error("Error fetching all users:", err);
        res.status(500).json({ message: "Failed to fetch contacts" });
    }
};

// Update Profile Details
exports.updateProfile = async (req, res) => {
    const { username, about, phoneNumber, location, status, socialLinks } = req.body;

    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Update fields
        if (username) user.username = username;
        if (about) user.about = about;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (location) user.location = location;
        if (status) user.status = status;
        if (socialLinks) user.socialLinks = { ...user.socialLinks, ...socialLinks };

        await user.save();
        res.json({ message: "Profile updated successfully", user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Upload Avatar
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please upload a file" });
        }

        const avatarUrl = `/uploads/${req.file.filename}`;

        let user = await User.findById(req.user.id);
        user.avatar = avatarUrl;
        await user.save();

        res.json({ message: "Avatar uploaded successfully", avatar: avatarUrl, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Upload Cover Image
exports.uploadCover = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please upload a file" });
        }

        const coverUrl = `/uploads/${req.file.filename}`;

        let user = await User.findById(req.user.id);
        user.coverImage = coverUrl;
        await user.save();

        res.json({ message: "Cover image uploaded successfully", coverImage: coverUrl, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

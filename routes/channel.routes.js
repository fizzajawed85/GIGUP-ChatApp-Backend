const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware.js");
const {
    createChannel,
    getChannels,
    joinChannel,
    postChannelUpdate,
    getChannelUpdates,
} = require("../controllers/channel.controller.js");

router.post("/", protect, upload.single("channelAvatar"), createChannel);
router.get("/", protect, getChannels);
router.post("/:channelId/join", protect, joinChannel);
router.post("/:channelId/update", protect, upload.single("updateFile"), postChannelUpdate);
router.get("/:channelId/updates", protect, getChannelUpdates);

module.exports = router;

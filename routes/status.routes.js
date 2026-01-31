const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const {
    createStatus,
    getStatusFeed,
    markStatusViewed
} = require("../controllers/status.controller.js");
const upload = require("../middlewares/upload.middleware.js");

router.post("/", protect, upload.single("statusFile"), createStatus);
router.get("/", protect, getStatusFeed);
router.post("/:statusId/view", protect, markStatusViewed);

module.exports = router;

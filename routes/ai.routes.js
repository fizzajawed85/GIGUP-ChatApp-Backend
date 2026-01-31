const express = require('express');
const router = express.Router();
console.log("Loading AI Routes...");
const aiController = require('../controllers/ai.controller');
const { protect } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// All AI routes require authentication
router.use(protect);

router.post('/chat', upload.single('file'), aiController.chatWithGiga);
router.get('/conversations', aiController.getConversations);
router.get('/messages/:id', aiController.getMessages);
router.delete('/conversation/:id', aiController.deleteConversation);
router.put('/conversation/:id', aiController.renameConversation);

module.exports = router;

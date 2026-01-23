const Message = require('../models/Message');

const saveMessage = async ({ chatId, userId, message, type }) => {
  const msg = await Message.create({ chat: chatId, user: userId, content: message, type });
  return msg;
};

module.exports = { saveMessage };

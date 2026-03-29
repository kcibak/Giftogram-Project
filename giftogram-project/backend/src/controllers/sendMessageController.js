function createSendMessageController({ sendMessage }) {
  return async function sendMessageController(req, res, next) {
    try {
      const result = await sendMessage(req.body);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  createSendMessageController,
};

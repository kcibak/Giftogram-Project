function createBlockUserController({ blockUser }) {
  return async function blockUserController(req, res, next) {
    try {
      const result = await blockUser(req.body);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  createBlockUserController,
};

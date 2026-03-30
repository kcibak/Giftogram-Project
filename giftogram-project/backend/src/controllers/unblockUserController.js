function createUnblockUserController({ unblockUser }) {
  return async function unblockUserController(req, res, next) {
    try {
      const result = await unblockUser(req.body);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  createUnblockUserController,
};

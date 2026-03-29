function createListAllUsersController({ listAllUsers }) {
  return async function listAllUsersController(req, res, next) {
    try {
      const result = await listAllUsers(req.query);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  createListAllUsersController,
};

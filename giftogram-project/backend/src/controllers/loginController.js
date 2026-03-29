function createLoginController({ loginUser }) {
  return async function loginController(req, res, next) {
    try {
      const user = await loginUser(req.body);

      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  createLoginController,
};

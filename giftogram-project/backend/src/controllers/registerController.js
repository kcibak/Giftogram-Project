function createRegisterController({ registerUser }) {
  return async function registerController(req, res, next) {
    try {
      const user = await registerUser(req.body);

      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  createRegisterController,
};

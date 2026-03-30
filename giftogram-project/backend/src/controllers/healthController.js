function createHealthController({ checkHealth }) {
  return async function healthController(req, res) {
    try {
      const result = await checkHealth();
      res.status(200).json(result);
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(503).json({
        status: "error",
        database: "down",
      });
    }
  };
}

module.exports = {
  createHealthController,
};

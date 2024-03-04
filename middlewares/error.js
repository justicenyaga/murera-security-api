const logger = require("../logger");

module.exports = function (err, req, res, next) {
  res.status(500).send("Something failed.");
  logger.error(err.message, err);
};

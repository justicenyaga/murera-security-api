const mongoose = require("mongoose");
const config = require("config");
const logger = require("../logger");

module.exports = function () {
  const db = config.get("db");

  mongoose.connect(db).then(() => logger.info(`Connected to ${db}...`));
};

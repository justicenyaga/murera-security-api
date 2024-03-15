const config = require("config");

module.exports = function () {
  if (!config.get("jwtPrivateKey")) {
    throw new Error("FATAL ERROR: jwtPrivateKey is not defined.");
  }
  if (!config.get("email")) {
    throw new Error("FATAL ERROR: email is not defined.");
  }
  if (!config.get("emailPassword")) {
    throw new Error("FATAL ERROR: emailPassword is not defined.");
  }
};

const config = require("config");

const mapper = (user) => {
  const baseUrl = config.get("assetsBaseUrl");
  return {
    ...user,
    image: baseUrl + user.image,
  };
};

module.exports = mapper;

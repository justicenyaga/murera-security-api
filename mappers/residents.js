const config = require("config");

const mapper = (resident) => {
  const baseUrl = config.get("assetsBaseUrl");
  return {
    ...resident,
    image: baseUrl + resident.image,
  };
};

module.exports = mapper;

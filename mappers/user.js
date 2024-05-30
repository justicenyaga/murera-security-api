const config = require("config");

const mapper = (user) => {
  const baseUrl = config.get("assetsBaseUrl");

  let nationalId = user.nationalId.toString();
  const lastThreeDigits = nationalId.slice(-3);
  const asterisks = "*".repeat(nationalId.length - 3);
  nationalId = `${asterisks}${lastThreeDigits}`;

  return {
    ...user,
    nationalId,
    image: baseUrl + user.image,
  };
};

module.exports = mapper;

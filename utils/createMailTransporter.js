const config = require("config");
const nodemailer = require("nodemailer");

module.exports = () => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: config.get("email"),
      pass: config.get("emailPassword"),
    },
  });

  return transporter;
};

// module.exports = () => {
//   const transporter = nodemailer.createTransport({
//     service: "hotmail",
//     auth: {
//       user: config.get("email"),
//       pass: config.get("emailPassword"),
//     },
//     from: config.get("email"),
//   });
//
//   return transporter;
// };

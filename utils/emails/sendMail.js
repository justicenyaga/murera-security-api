const config = require("config");
const createMailTransporter = require("../createMailTransporter");

module.exports = (to, subject, html) => {
  const transporter = createMailTransporter();
  const mailOptions = {
    from: `"Murera Security" <${config.get("email")}>`,
    to,
    subject,
    html,
  };

  return new Promise((resolve, _reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        resolve({ ok: false, response: null, error: err });
      } else {
        resolve({ ok: true, response: info.response, error: null });
      }
    });
  });
};

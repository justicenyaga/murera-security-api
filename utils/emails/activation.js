const config = require("config");
const createMailTransporter = require("../createMailTransporter");

module.exports = (user) => {
  const transporter = createMailTransporter();
  const mailOptions = {
    from: `"Murera Security" <${config.get("email")}>`,
    to: user.email,
    subject: "Verify your email",
    html: `
      <p>Hi ${user.firstName},</p>
      <p>Thanks for signing up with Murera Security. Click the button below to verify your email.</p>
      <a style="display: block; width: fit-content; margin: 0 auto; padding: 10px 20px; background-color: #fc5c65; color: white; text-decoration: none; border-radius: 5px;" href="${config.get("serverUrl")}/api/users/verify-email/${user.emailToken}">Verify Email</a>
      <p>If you did not sign up for Murera Security, please ignore this email.</p>
      <p>Best,</p>
      <p>Murera Security Team</p>
    `,
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

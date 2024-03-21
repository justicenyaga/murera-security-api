const sendMail = require("./sendMail");

module.exports = (user) => {
  const html = `
    <p>Hi ${user.firstName},</p>
    <p>Your account has been activated successfully.</p>
    <p>Best,</p>
    <p>Murera Security Team</p>
  `;
  const to = user.email;
  const subject = "Account Activation";
  return sendMail(to, subject, html);
};

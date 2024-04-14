const sendMail = require("./sendMail");

module.exports = (user) => {
  const to = user.email;
  const subject = "Password Reset Successfully";
  const html = `
    <p>Hi ${user.firstName},</p>
    <p>Your password has been successfully reset</p>
    <p>Best,</p>
    <p>Murera Security Team</p>
  `;
  return sendMail(to, subject, html);
};

const sendMail = require("./sendMail");

module.exports = (user) => {
  const to = user.email;
  const subject = "Murera Security Police Officer Account Password";
  const html = `
    <div>
      <p>Hi ${user.firstName},</p>
      <p>Your officer account has been created successfully.</p>
      <p>Your password is <strong>${user.password}</strong>. Please change it as soon as possible.</p>
      <p>Best,</p>
      <p>Murera Security Team</p>
    </div>
  `;
  return sendMail(to, subject, html);
};

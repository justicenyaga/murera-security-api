const sendMail = require("./sendMail");

module.exports = (user) => {
  const to = user.email;
  const subject = "Password Reset OTP";
  const html = `
    <div>
      <p>Hi ${user.firstName},</p>
      <p>Your OTP is <strong>${user.passwordResetOtp}</strong>. It will expire in 10 minutes.</p>
      <p>If this request was not made by you, please ignore this email.</p>
      <p>Best,</p>
      <p>Murera Security Team</p>
    </div>
  `;
  return sendMail(to, subject, html);
};

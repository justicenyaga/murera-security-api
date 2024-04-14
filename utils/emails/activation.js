const config = require("config");
const sendMail = require("./sendMail");

module.exports = (user) => {
  const to = user.email;
  const subject = "Verify Your Email";
  const html = `
    <p>Hi ${user.firstName}👋,</p>
    <p>Thanks for signing up with Murera Security. Click the button below to verify your email.</p>
    <a style="display: block; width: fit-content; padding: 10px 20px; background-color: #fc5c65; color: white; text-decoration: none; border-radius: 5px;" href="${config.get("serverUrl")}/api/users/verify-email/${user.emailToken}">Verify Email</a>
    <p>If you did not sign up for Murera Security, please ignore this email.</p>
    <p>Best,</p>
    <p>Murera Security Team</p>
  `;
  return sendMail(to, subject, html);
};

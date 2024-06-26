const _ = require("lodash");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const express = require("express");
const router = express.Router();

const { User } = require("../models/user");
const logger = require("../logger");
const sendPasswordResetOtp = require("../utils/emails/passwordResetOtp");
const sendPasswordResetSuccessEmail = require("../utils/emails/passwordResetSuccess");
const validateWith = require("../middlewares/validate");

router.post("/", validateWith(passwordResetValidator), async (req, res) => {
  const { email, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).send("User not found");

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);

  const emailData = { email, firstName: user.firstName };
  const { ok, error } = await sendPasswordResetSuccessEmail(emailData);
  if (!ok) {
    logger.error(error.message);
    return res.status(500).send("Failed to send email.");
  }

  user.passwordResetOtp = null;
  user.passwordResetOtpExpiry = null;

  await user.save();

  const msg = "Password successfully reset";
  const status = user.isActive ? 200 : 201;

  res.status(status).send(msg);
});

router.post("/request", validateWith(validateEmailOrID), async (req, res) => {
  const { email, nationalId } = req.body;
  let user;
  if (email) {
    user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send("User with the given email was not found");
    }
  } else {
    user = await User.findOne({ nationalId });
    if (!user) {
      return res
        .status(404)
        .send("User with the given national ID was not found");
    }
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  const otpExpiry = new Date();
  otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // 10 minutes from now

  user.passwordResetOtp = otp;
  user.passwordResetOtpExpiry = otpExpiry;

  const emailData = _.pick(user, ["firstName", "email", "passwordResetOtp"]);

  const { ok, error } = await sendPasswordResetOtp(emailData);
  if (!ok) {
    logger.error(error.message);
    return res.status(500).send("Failed to send email.");
  }

  await user.save();

  res.send({ email: user.email });
});

router.post("/admin-request", validateWith(validateEmail), async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!(user?.isAdmin || user?.isSuperAdmin)) {
    return res.status(400).send("Admin with the given email does not exist");
  }

  res.send({ email: user.email });
});

router.post("/verify-otp", validateWith(validateOtp), async (req, res) => {
  const user = await User.findOne({
    passwordResetOtp: req.body.otp,
    passwordResetOtpExpiry: { $gt: Date.now() },
  });
  if (!user) return res.status(400).send("Invalid or expired OTP");

  res.send("OTP verified successfully.");
});

function validateEmail(email) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
  });
  return schema.validate(email);
}

function validateEmailOrID(emailOrId) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).email(),
    nationalId: Joi.number().min(100000).max(50000000),
  })
    .or("email", "nationalId")
    .messages({
      "object.missing": '"email" or "nationalId" is required.',
    });
  return schema.validate(emailOrId);
}

function validateOtp(otp) {
  const schema = Joi.object({
    otp: Joi.number().min(100000).max(999999).required(),
  });
  return schema.validate(otp);
}

function passwordResetValidator(password) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    newPassword: Joi.string().min(5).max(255).required(),
  });
  return schema.validate(password);
}

module.exports = router;

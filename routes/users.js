const _ = require("lodash");
const bcrypt = require("bcrypt");
const config = require("config");
const crypto = require("crypto");
const Joi = require("joi");
const express = require("express");
const router = express.Router();

const { User, validateUser } = require("../models/user");
const auth = require("../middlewares/auth");
const logger = require("../logger");
const resendActivationEmail = require("../utils/emails/resendActivation");
const sendActivationEmail = require("../utils/emails/activation");
const sendActivationSuccessEmail = require("../utils/emails/activationSuccess");
const sendPasswordResetOtp = require("../utils/emails/passwordResetOtp");
const sendPasswordResetSuccessEmail = require("../utils/emails/passwordResetSuccess");
const views = require("../views/views");
const validateWith = require("../middlewares/validate");

const serverUrl = config.get("serverUrl");

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -__v");
  res.send(user);
});

router.post("/check-email", validateWith(validateEmail), async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("Email already registered");

  res.send("Email is available");
});

router.post("/check-nid", validateWith(validateNId), async (req, res) => {
  const user = await User.findOne({ nationalId: req.body.nationalId });
  if (user) return res.status(400).send("National ID already registered");

  res.send("National ID is available");
});

router.post("/", validateWith(validateUser), async (req, res) => {
  const { firstName, lastName, nationalId, email, password } = req.body;

  let user = await User.findOne({ nationalId });
  if (user) {
    return res
      .status(400)
      .send("User with the given ID number already registered.");
  }

  user = await User.findOne({ email });
  if (user) {
    return res.status(400).send("An account with this email already exists.");
  }

  user = new User({
    firstName,
    lastName,
    nationalId,
    email,
    password,
    emailToken: crypto.randomBytes(64).toString("hex"),
  });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  const emailData = { firstName, email, emailToken: user.emailToken };

  const { ok, error } = await sendActivationEmail(emailData);
  if (!ok) {
    logger.error(error.message);
    return res.status(500).send("Failed to send email.");
  }

  await user.save();

  res.send({ _id: user._id, firstName, lastName, email });
});

router.post(
  "/resend-verification",
  validateWith(validateEmail),
  async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).send("User with the given email was not found");
    }

    if (user.isActive) return res.status(400).send("User is already verified");

    const emailData = _.pick(user, ["firstName", "email", "emailToken"]);

    const { ok, error } = await resendActivationEmail(emailData);
    if (!ok) {
      logger.error(error.message);
      return res.status(500).send("Failed to send email.");
    }

    return res.send("Verification email sent");
  },
);

router.post(
  "/password-reset-request",
  validateWith(validateEmailOrID),
  async (req, res) => {
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

    res.send("Password reset OTP sent");
  },
);

router.post(
  "/verify-password-reset-otp",
  validateWith(validateOtp),
  async (req, res) => {
    const user = await User.findOne({
      passwordResetOtp: req.body.otp,
      passwordResetOtpExpiry: { $gt: Date.now() },
    });
    if (!user) return res.status(400).send("Invalid or expired OTP");

    res.send({ email: user.email });
  },
);

router.post(
  "/reset-password",
  validateWith(passwordResetValidator),
  async (req, res) => {
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

    res.send("Password successfully reset");
  },
);

router.get("/verify-email/:emailToken", async (req, res) => {
  const user = await User.findOne({ emailToken: req.params.emailToken });
  if (!user) {
    return res.status(400).render(views.ACTIVATION_FAILED, { serverUrl });
  }

  user.isActive = true;
  user.emailToken = null;

  const emailData = _.pick(user, ["firstName", "email"]);
  const { ok, error } = await sendActivationSuccessEmail(emailData);
  if (!ok) {
    logger.error(error.message);
    return res.status(500).send("Failed to send email.");
  }

  await user.save();

  res.render(views.ACTIVATION_SUCCESS, { serverUrl });
});

function validateEmail(email) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
  });
  return schema.validate(email);
}

function validateNId(nid) {
  const schema = Joi.object({
    nationalId: Joi.number().min(100000).max(50000000).required(),
  });
  return schema.validate(nid);
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

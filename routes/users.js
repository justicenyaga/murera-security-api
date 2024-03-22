const _ = require("lodash");
const bcrypt = require("bcrypt");
const config = require("config");
const crypto = require("crypto");
const express = require("express");
const router = express.Router();

const { User, validateUser } = require("../models/user");
const auth = require("../middlewares/auth");
const logger = require("../logger");
const sendActivationEmail = require("../utils/emails/activation");
const sendActivationSuccessEmail = require("../utils/emails/activationSuccess");
const views = require("../views/views");
const validateWith = require("../middlewares/validate");

const serverUrl = config.get("serverUrl");

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -__v");
  res.send(user);
});

router.post("/", validateWith(validateUser), async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered.");

  user = new User({
    ..._.pick(req.body, ["firstName", "lastName", "email", "password"]),
    emailToken: crypto.randomBytes(64).toString("hex"),
  });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  const emailData = _.pick(user, ["firstName", "email", "emailToken"]);

  const { ok, error } = await sendActivationEmail(emailData);
  if (!ok) {
    logger.error(error.message);
    return res.status(500).send("Failed to send email.");
  }

  await user.save();

  res.send(_.pick(user, ["_id", "firstName", "lastName", "email"]));
});

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

module.exports = router;

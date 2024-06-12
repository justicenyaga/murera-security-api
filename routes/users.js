const _ = require("lodash");
const bcrypt = require("bcrypt");
const config = require("config");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const Joi = require("joi");
const express = require("express");
const router = express.Router();

const { User, validateUser } = require("../models/user");
const auth = require("../middlewares/auth");
const imageResize = require("../middlewares/imageResize");
const logger = require("../logger");
const resendActivationEmail = require("../utils/emails/resendActivation");
const sendActivationEmail = require("../utils/emails/activation");
const sendActivationSuccessEmail = require("../utils/emails/activationSuccess");
const userMapper = require("../mappers/user");
const views = require("../views/views");
const validateWith = require("../middlewares/validate");

const serverUrl = config.get("serverUrl");

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, "uploads");
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname);
    let basename = path.basename(file.originalname, ext);
    basename = `${basename}-${Date.now()}`;

    cb(null, basename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 25 },
  fileFilter: function (_req, file, cb) {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."), false);
    }
  },
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -__v -emailToken -passwordResetOtp -passwordResetOtpExpiry -updatedAt",
  );
  if (!user) return res.status(404).send("User does not exist");
  res.send(userMapper(user.toObject()));
});

router.post(
  "/check-contacts",
  validateWith(validateContacts),
  async (req, res) => {
    let user = await User.findOne({ phone: req.body.phone });
    if (user) return res.status(400).send("Phone number is already in use");

    user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send("Email is already in use");

    res.send("Contacts available");
  },
);

router.post("/check-nid", validateWith(validateNId), async (req, res) => {
  const user = await User.findOne({ nationalId: req.body.nationalId });
  if (user) return res.status(400).send("National ID already registered");

  res.send("National ID is available");
});

router.post(
  "/",
  [upload.single("image"), imageResize, validateWith(validateUser)],
  async (req, res) => {
    const data = req.body;

    let user = await User.findOne({ nationalId: data.nationalId });
    if (user) {
      return res
        .status(400)
        .send("User with the given ID number already registered.");
    }

    user = await User.findOne({ email: data.email });
    if (user) {
      return res.status(400).send("An account with this email already exists.");
    }

    const image = req.image || "default.jpg";

    user = new User({
      firstName: data.firstName,
      lastName: data.lastName,
      nationalId: data.nationalId,
      email: data.email,
      dob: data.dob,
      phone: data.phone,
      image,
      password: data.password,
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

    const omitFields = ["emailToken", "password", "__v", "updatedAt"];
    res.send(userMapper(_.omit(user.toObject(), omitFields)));
  },
);

router.put(
  "/change-image",
  [upload.single("image"), auth, imageResize],
  async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).send("User not found");

    user.image = req.image;
    await user.save();

    res.send("Image uploaded successfully");
  },
);

router.post(
  "/resend-verification",
  validateWith(validateEmail),
  async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).send("User with the given email was not found");
    }

    if (user.isActive) return res.status(400).send("User is already verified");

    user.emailToken = crypto.randomBytes(64).toString("hex");
    await user.save();

    const emailData = _.pick(user, ["firstName", "email", "emailToken"]);

    const { ok, error } = await resendActivationEmail(emailData);
    if (!ok) {
      logger.error(error.message);
      return res.status(500).send("Failed to send email.");
    }

    return res.send("Verification email sent");
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

router.put(
  "/change-email",
  [auth, validateWith(validateEmailPassword)],
  async (req, res) => {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).send("Email already in use");

    user = await User.findById(req.user._id);
    if (!user) return res.status(404).send("User not found");

    const validpassword = await bcrypt.compare(password, user.password);
    if (!validpassword) return res.status(400).send("Incorrect password.");

    user.email = email;
    await user.save();

    res.send("Email changed successfully");
  },
);

function validateEmail(email) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
  });
  return schema.validate(email);
}

function validateEmailPassword(body) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });
  return schema.validate(body);
}

function validateContacts(contacts) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    phone: Joi.string().min(6).max(15).required(),
  });

  return schema.validate(contacts);
}

function validateNId(nid) {
  const schema = Joi.object({
    nationalId: Joi.number().min(100000).max(50000000).required(),
  });
  return schema.validate(nid);
}

module.exports = router;

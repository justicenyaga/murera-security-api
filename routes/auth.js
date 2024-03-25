const bcrypt = require("bcrypt");
const Joi = require("joi");
const express = require("express");
const router = express.Router();

const { User } = require("../models/user");
const auth = require("../middlewares/auth");
const validateWith = require("../middlewares/validate");

router.post("/", validateWith(validateBody), async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Invalid email and/or password.");

  const validpassword = await bcrypt.compare(req.body.password, user.password);
  if (!validpassword) {
    return res.status(400).send("Invalid email and/or password.");
  }

  res.send(user.generateAuthToken());
});

router.post("/refresh-token", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -__v");
  if (!user) return res.status(404).send("Invalid token");

  const token = user.generateAuthToken();
  res.header("x-auth-token", token).send(user);
});

function validateBody(body) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });
  return schema.validate(body);
}

module.exports = router;

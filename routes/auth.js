const _ = require("lodash");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const express = require("express");
const router = express.Router();

const { User } = require("../models/user");
const auth = require("../middlewares/auth");
const validateWith = require("../middlewares/validate");

router.post("/", validateWith(validateBody), async (req, res) => {
  const { email, nationalId, password } = req.body;

  let user;
  if (email) {
    user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("No registered user with the given email.");
    }
  } else {
    user = await User.findOne({ nationalId });
    if (!user) {
      return res
        .status(400)
        .send("No registered user with the given national ID.");
    }
  }

  const validpassword = await bcrypt.compare(password, user.password);
  if (!validpassword) {
    return res.status(400).send("Incorrect password.");
  }

  const token = user.generateAuthToken();
  res
    .header("x-auth-token", token)
    .send(_.pick(user, ["_id", "firstName", "lastName", "email"]));
});

router.post("/refresh-token", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -__v");
  if (!user) return res.status(404).send("Invalid token");

  const token = user.generateAuthToken();
  res.header("x-auth-token", token).send(user);
});

function validateBody(body) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).email(),
    nationalId: Joi.number().min(100000).max(50000000),
    password: Joi.string().min(5).max(255).required(),
  })
    .or("email", "nationalId")
    .messages({
      "object.missing": '"email" or "nationalId" is required.',
    });
  return schema.validate(body);
}

module.exports = router;

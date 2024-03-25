const config = require("config");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Joi = require("joi");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
    },
    nationalId: {
      type: Number,
      required: true,
      unique: true,
      min: 100000,
      max: 50000000,
    },
    email: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 255,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 1024,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    emailToken: String,
    isAdmin: Boolean,
    isSuperAdmin: Boolean,
  },
  { timestamps: true },
);

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      firstName: this.firstName,
      lastName: this.lastName,
      nationalId: this.nationalId,
      email: this.email,
      isActive: this.isActive,
      isAdmin: this.isAdmin,
      isSuperAdmin: this.isSuperAdmin,
    },
    config.get("jwtPrivateKey"),
  );
  return token;
};

const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const schema = Joi.object({
    firstName: Joi.string().min(3).max(50).required(),
    lastName: Joi.string().min(3).max(50).required(),
    nationalId: Joi.number().min(100000).max(50000000).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
    isAdmin: Joi.boolean(),
    isSuperAdmin: Joi.boolean(),
  });
  return schema.validate(user);
}

exports.User = User;
exports.validateUser = validateUser;

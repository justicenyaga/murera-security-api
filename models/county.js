const mongoose = require("mongoose");
const Joi = require("joi");

const County = mongoose.model(
  "County",
  new mongoose.Schema({
    code: {
      type: Number,
      required: true,
      unique: true,
      min: 0,
      max: 46,
    },
    name: {
      type: String,
      required: true,
      min: 3,
      max: 255,
    },
  }),
);

function validateCounty(county) {
  const schema = Joi.object({
    code: Joi.number().min(0).max(46).required(),
    name: Joi.string().min(3).max(255).required(),
  });
  return schema.validate(county);
}

exports.validateCounty = validateCounty;
exports.County = County;

const mongoose = require("mongoose");
const Joi = require("joi");

const SubCounty = mongoose.model(
  "SubCounty",
  new mongoose.Schema({
    county: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "County",
      required: true,
    },
    name: {
      type: String,
      required: true,
      min: 3,
      max: 255,
    },
  }),
);

function validateSubCounty(subCounty) {
  const schema = Joi.object({
    countyCode: Joi.number().min(0).max(46).required(),
    name: Joi.string().required(),
  });
  return schema.validate(subCounty);
}

exports.validateSubCounty = validateSubCounty;
exports.SubCounty = SubCounty;

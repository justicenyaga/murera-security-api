const mongoose = require("mongoose");
const Joi = require("joi");

const PoliceStation = mongoose.model(
  "PoliceStation",
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 255,
      },
      phone: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 15,
        unique: true,
      },
      subCounty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCounty",
        required: true,
      },
      officersCount: {
        type: Number,
        default: 0,
      },
    },
    { timestamps: true },
  ),
);

function validateStation(station) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).required(),
    phone: Joi.string().min(6).max(15).required(),
    subCounty: Joi.objectId().required(),
    officersCount: Joi.number(),
  });

  return schema.validate(station);
}

exports.validateStation = validateStation;
exports.PoliceStation = PoliceStation;

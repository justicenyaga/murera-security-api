const mongoose = require("mongoose");
const Joi = require("joi");

const Officer = mongoose.model(
  "Officer",
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      badgeNumber: {
        type: String,
        required: true,
        unique: true,
      },
      station: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PoliceStation",
        required: true,
      },
    },
    { timestamps: true },
  ),
);

function validateOfficer(officer) {
  const schema = Joi.object({
    firstName: Joi.string().min(3).max(50).required(),
    lastName: Joi.string().min(3).max(50).required(),
    nationalId: Joi.number().min(100000).max(50000000).required(),
    email: Joi.string().min(5).max(255).required().email(),
    image: Joi.string().min(3).max(255),
    dob: Joi.date().required(),
    phone: Joi.string().min(6).max(15).required(),
    badgeNumber: Joi.string().required(),
    stationId: Joi.objectId().required(),
  });
  return schema.validate(officer);
}

exports.Officer = Officer;
exports.validateOfficer = validateOfficer;

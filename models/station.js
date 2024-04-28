const mongoose = require("mongoose");
const Joi = require("joi");

const locationSchema = new mongoose.Schema(
  {
    longitude: {
      type: Number,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const stationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      type: locationSchema,
      required: true,
    },
    officersCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const PoliceStation = mongoose.model("PoliceStation", stationSchema);

function validateStation(station) {
  const schema = Joi.object({
    name: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    address: Joi.string().required(),
    officersCount: Joi.number(),
    location: Joi.object({
      longitude: Joi.number().required(),
      latitude: Joi.number().required(),
    }).required(),
  });

  return schema.validate(station);
}

exports.PoliceStation = PoliceStation;
exports.stationSchema = stationSchema;
exports.validateStation = validateStation;

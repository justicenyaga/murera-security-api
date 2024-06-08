const mongoose = require("mongoose");
const Joi = require("joi");

const status = require("../utils/caseStatus");

const Case = mongoose.model(
  "Case",
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
      },
      description: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        enum: Object.values(status),
        default: status.PENDING,
      },
      reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      station: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PoliceStation",
        required: true,
      },
      resolvedAt: Date,
    },
    { timestamps: true },
  ),
);

function validateCase(caseObj) {
  const schema = Joi.object({
    title: Joi.string().min(5).max(255).required(),
    description: Joi.string().required(),
    stationId: Joi.objectId().required(),
  });

  return schema.validate(caseObj);
}

exports.Case = Case;
exports.validateCase = validateCase;

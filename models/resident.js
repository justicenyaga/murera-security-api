const mongoose = require("mongoose");
const Joi = require("joi");

const residentSchema = new mongoose.Schema(
  {
    user: {
      type: new mongoose.Schema({
        _id: {
          type: mongoose.Types.ObjectId,
          required: true,
        },
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
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      }),
      required: true,
    },
    image: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 255,
    },
    dob: {
      type: Date,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 15,
    },
    county: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
    },
    subCounty: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
    },
    ward: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
    },
    village: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
    },
  },
  { timestamps: true },
);

const Resident = mongoose.model("Resident", residentSchema);

function validateResident(resident) {
  const schema = Joi.object({
    dob: Joi.date().required(),
    phone: Joi.string().min(6).max(15).required(),
    county: Joi.string().min(3).max(50).required(),
    subCounty: Joi.string().min(3).max(50).required(),
    ward: Joi.string().min(3).max(50).required(),
    village: Joi.string().min(3).max(50).required(),
  });
  return schema.validate(resident);
}

exports.Resident = Resident;
exports.validateResident = validateResident;

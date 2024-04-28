const _ = require("lodash");
const express = require("express");
const router = express.Router();

const { PoliceStation, validateStation } = require("../models/station");
const admin = require("../middlewares/admin");
const auth = require("../middlewares/auth");
const validateWith = require("../middlewares/validate");

router.post(
  "/",
  [auth, admin, validateWith(validateStation)],
  async (req, res) => {
    const data = req.body;

    const station = new PoliceStation({
      name: data.name,
      phoneNumber: data.phoneNumber,
      address: data.address,
      officersCount: data.officerCount,
      location: {
        longitude: data.location.longitude,
        latitude: data.location.latitude,
      },
    });

    await station.save();

    res.send(_.omit(station.toObject(), ["updatedAt", "__v"]));
  },
);

module.exports = router;

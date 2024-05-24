const _ = require("lodash");
const express = require("express");
const router = express.Router();

const { Case, validateCase } = require("../models/case");
const { PoliceStation } = require("../models/station");
const { User } = require("../models/user");
const auth = require("../middlewares/auth");
const validateWith = require("../middlewares/validate");

router.post("/", [auth, validateWith(validateCase)], async (req, res) => {
  const data = req.body;

  const user = await User.findById(req.user._id);
  if (!user) return res.status(400).send("Invalid token");

  const station = await PoliceStation.findById(data.stationId);
  if (!station) {
    return res.status(404).send("The station with the given ID was not found.");
  }

  const newCase = new Case({
    title: data.title,
    description: data.description,
    location: {
      longitude: data.location.longitude,
      latitude: data.location.latitude,
    },
    reportedBy: user._id,
    station: station._id,
  });

  await newCase.save();

  const output = {
    ..._.omit(newCase.toObject(), ["__v", "updatedAt"]),
    station: station.name,
  };

  res.send(output);
});

module.exports = router;

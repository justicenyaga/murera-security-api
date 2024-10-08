const _ = require("lodash");
const express = require("express");
const router = express.Router();

const { Case, validateCase } = require("../models/case");
const { PoliceStation } = require("../models/station");
const { User } = require("../models/user");
const admin = require("../middlewares/admin");
const auth = require("../middlewares/auth");
const validateWith = require("../middlewares/validate");

router.get("/all", [auth, admin], async (_req, res) => {
  const cases = await Case.find()
    .select("-__v -updatedAt")
    .populate("reportedBy", "firstName lastName")
    .populate("station");

  res.send(cases);
});

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

router.get("/user", auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(400).send("Invalid token");

  const cases = await Case.find({ reportedBy: user._id })
    .select("-__v -updatedAt -reportedBy")
    .populate("station", "name")
    .sort("-createdAt");
  res.send(cases);
});

module.exports = router;

const express = require("express");
const router = express.Router();

const { SubCounty } = require("../models/subCounty");
const { PoliceStation, validateStation } = require("../models/station");
const auth = require("../middlewares/auth");
const superAdmin = require("../middlewares/superAdmin");
const validateWith = require("../middlewares/validate");

router.post(
  "/",
  [auth, superAdmin, validateWith(validateStation)],
  async (req, res) => {
    const data = req.body;

    const subCounty = await SubCounty.findById(data.subCounty)
      .select("name county")
      .populate("county", "code name -_id");
    if (!subCounty) {
      return res
        .status(404)
        .send("Sub-county with the given ID was not found.");
    }

    let station = await PoliceStation.findOne({ phone: data.phone });
    if (station) {
      return res
        .status(400)
        .send("Police station with the given phone number already exists.");
    }

    station = new PoliceStation({
      name: data.name,
      phone: data.phone,
      subCounty: subCounty._id,
      officersCount: data.officerCount,
    });

    await station.save();

    const output = {
      _id: station._id,
      name: station.name,
      phone: station.phone,
      officersCount: station.officersCount,
      subCounty,
    };
    res.send(output);
  },
);

router.get("/", auth, async (_req, res) => {
  const stations = await PoliceStation.find()
    .select("-updatedAt -__v")
    .populate({
      path: "subCounty",
      select: "name county",
      populate: {
        path: "county",
        select: "code name -_id",
      },
    });
  res.send(stations);
});

module.exports = router;

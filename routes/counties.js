const _ = require("lodash");
const express = require("express");
const router = express.Router();

const { County, validateCounty } = require("../models/county");
const superAdmin = require("../middlewares/superAdmin");
const auth = require("../middlewares/auth");
const validateWith = require("../middlewares/validate");

router.post(
  "/",
  [auth, superAdmin, validateWith(validateCounty)],
  async (req, res) => {
    let county = await County.findOne({ code: req.body.code });
    if (county) {
      return res.status(400).send("County with the given code already exists.");
    }

    county = new County({
      code: req.body.code,
      name: req.body.name,
    });
    await county.save();

    res.send(_.pick(county.toObject(), ["code", "name"]));
  },
);

router.get("/", async (_req, res) => {
  const counties = await County.find().select("code name").sort("name");
  res.send(counties);
});

router.get("/:code", async (req, res) => {
  const county = await County.findOne({ code: req.params.code }).select(
    "code name",
  );
  if (!county) {
    return res.status(404).send("County with the given code was not found.");
  }

  res.send(county);
});

router.put(
  "/:code",
  [auth, superAdmin, validateWith(validateCounty)],
  async (req, res) => {
    const county = await County.findOne({ code: req.params.code });
    if (!county) {
      return res.status(404).send("County with the given code was not found.");
    }

    county.code = req.body.code;
    county.name = req.body.name;
    await county.save();

    res.send(_.pick(county.toObject(), ["code", "name"]));
  },
);

module.exports = router;

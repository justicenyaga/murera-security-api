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

module.exports = router;

const express = require("express");
const router = express.Router();

const { County } = require("../models/county");
const { SubCounty, validateSubCounty } = require("../models/subCounty");
const auth = require("../middlewares/auth");
const superAdmin = require("../middlewares/superAdmin");
const validateWith = require("../middlewares/validate");

router.post(
  "/",
  [auth, superAdmin, validateWith(validateSubCounty)],
  async (req, res) => {
    const county = await County.findOne({ code: req.body.countyCode }).select(
      "code name",
    );
    if (!county) {
      return res.status(404).send("County with the given code was not found.");
    }

    const subCounty = new SubCounty({
      name: req.body.name,
      county: county._id,
    });
    await subCounty.save();

    const output = {
      _id: subCounty._id,
      name: subCounty.name,
      county: {
        code: county.code,
        name: county.name,
      },
    };
    res.send(output);
  },
);

module.exports = router;

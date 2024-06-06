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

router.get("/", async (_req, res) => {
  const subCounties = await SubCounty.find()
    .populate("county", "code name -_id")
    .select("name county");
  res.send(subCounties);
});

router.get("/:id", async (req, res) => {
  const subCounty = await SubCounty.findById(req.params.id)
    .select("name county")
    .populate("county", "code name -_id");
  if (!subCounty) {
    return res.status(404).send("Sub-county with the given ID was not found.");
  }

  res.send(subCounty);
});

router.put(
  "/:id",
  [auth, superAdmin, validateWith(validateSubCounty)],
  async (req, res) => {
    const county = await County.findOne({ code: req.body.countyCode });
    if (!county) {
      return res.status(404).send("County with the given code was not found.");
    }

    const subCounty = await SubCounty.findById(req.params.id);
    if (!subCounty) {
      return res
        .status(404)
        .send("Sub-county with the given ID was not found.");
    }

    subCounty.name = req.body.name;
    subCounty.county = county._id;
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

router.delete("/:id", [auth, superAdmin], async (req, res) => {
  const subCounty = await SubCounty.findById(req.params.id)
    .select("name county")
    .populate("county", "code name -_id");
  if (!subCounty) {
    return res.status(404).send("Sub-county with the given ID was not found.");
  }
  await subCounty.deleteOne();
  res.send(subCounty);
});

module.exports = router;

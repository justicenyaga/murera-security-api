const _ = require("lodash");
const multer = require("multer");
const path = require("path");
const express = require("express");
const router = express.Router();

const { Resident, validateResident } = require("../models/resident");
const auth = require("../middlewares/auth");
const imageResize = require("../middlewares/imageResize");
const validateWith = require("../middlewares/validate");
const residentMapper = require("../mappers/residents");

// Set up multer for profile picture upload
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, "uploads");
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname);
    let basename = path.basename(file.originalname, ext);
    basename = `${basename}-${Date.now()}`;

    cb(null, basename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 25 },
  fileFilter: function (_req, file, cb) {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."), false);
    }
  },
});

router.post(
  "/",
  [upload.single("image"), auth, validateWith(validateResident), imageResize],
  async (req, res) => {
    let resident = await Resident.findOne({ "user._id": req.user._id });
    if (resident) return res.status(400).send("Resident already registered.");

    resident = await Resident.findOne({ nationalId: req.body.nationalId });
    if (resident) {
      return res
        .status(400)
        .send("Resident with the given national ID already registered.");
    }

    const userData = _.pick(req.user, [
      "_id",
      "firstName",
      "lastName",
      "email",
      "isActive",
    ]);

    const residentData = {
      ..._.pick(req.body, [
        "nationalId",
        "dob",
        "phone",
        "gender",
        "county",
        "subCounty",
        "ward",
        "village",
      ]),
      user: userData,
    };

    residentData.image = req.image;

    resident = await Resident.create(residentData);
    resident = residentMapper(resident.toObject());
    res.send(resident);
  },
);

module.exports = router;

const _ = require("lodash");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const express = require("express");
const router = express.Router();

const { Officer, validateOfficer } = require("../models/officer");
const { User } = require("../models/user");
const { PoliceStation } = require("../models/station");
const auth = require("../middlewares/auth");
const imageResize = require("../middlewares/imageResize");
const logger = require("../logger");
const sendOfficerPassword = require("../utils/emails/officerPassword");
const superAdmin = require("../middlewares/superAdmin");
const userMapper = require("../mappers/user");
const validateWith = require("../middlewares/validate");

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
  "/register",
  [
    auth,
    superAdmin,
    upload.single("image"),
    imageResize,
    validateWith(validateOfficer),
  ],
  async (req, res) => {
    const data = req.body;

    let user = await User.findOne({ email: data.email });

    if (user) {
      const officer = await Officer.findOne({ user: user._id });
      if (officer) return res.status(400).send("Officer already registered.");
    }

    const station = await PoliceStation.findById(data.stationId);
    if (!station) return res.status(400).send("Invalid station.");

    const image = req.image || "default.jpg";

    if (!user) {
      user = new User({
        firstName: data.firstName,
        lastName: data.lastName,
        nationalId: data.nationalId,
        dob: data.dob,
        email: data.email,
        phone: data.phone,
        isActive: true,
        image,
      });

      const password = crypto.randomBytes(4).toString("hex") + "Aa1@";
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      const emailData = {
        firstName: user.firstName,
        email: user.email,
        password,
      };
      const { ok, error } = await sendOfficerPassword(emailData);
      if (!ok) {
        logger.error(error.message);
        return res.status(500).send("Failed to send email.");
      }
    }

    user.isAdmin = true;
    await user.save();

    const officer = new Officer({
      user: user._id,
      badgeNumber: data.badgeNumber,
      station: station._id,
    });
    await officer.save();

    const omitFields = ["password", "__v", "updatedAt"];
    res.send({
      user: userMapper(_.omit(user.toObject(), omitFields)),
      badgeNumber: officer.badgeNumber,
      station: _.omit(station.toObject(), ["__v", "updatedAt"]),
    });
  },
);

module.exports = router;

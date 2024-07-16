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
const admin = require("../middlewares/admin");
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

router.get("/all", [auth, superAdmin], async (_req, res) => {
  const officers = await Officer.find()
    .select("-__v -updatedAt")
    .populate("user", "-password -__v -updatedAt")
    .populate("station", "-__v -updatedAt")
    .sort("badgeNumber");

  res.send(
    officers.map((officer) => ({
      ...officer.toObject(),
      user: userMapper(officer.toObject().user),
    })),
  );
});

router.get("/mystation", [auth, admin], async (req, res) => {
  const user = await User.findById(req.user._id);
  const officer = await Officer.findOne({ user: user._id });

  const officers = await Officer.find({ station: officer.station })
    .select("-__v -updatedAt")
    .populate("user", "-password -__v -updatedAt")
    .populate("station", "-__v -updatedAt")
    .sort("badgeNumber");

  res.send(
    officers.map((officer) => ({
      ...officer.toObject(),
      user: userMapper(officer.toObject().user),
    })),
  );
});

router.get("/:id", [auth, superAdmin], async (req, res) => {
  const officer = await Officer.findById(req.params.id)
    .select("-__v -updatedAt")
    .populate("user", "-password -__v -updatedAt")
    .populate({
      path: "station",
      select: "name subCounty",
      populate: {
        path: "subCounty",
        select: "name county",
        populate: {
          path: "county",
          select: "name code",
        },
      },
    });

  if (!officer) return res.status(404).send("Officer not found.");
  res.send(officer);
});

router.put(
  "/:id",
  [auth, superAdmin, validateWith(validateOfficer)],
  async (req, res) => {
    const officer = await Officer.findById(req.params.id);
    if (!officer) return res.status(404).send("Officer not found.");

    const data = req.body;

    const station = await PoliceStation.findById(data.stationId);
    if (!station) return res.status(400).send("Invalid station.");

    const user = await User.findById(officer.user);
    user.firstName = data.firstName;
    user.lastName = data.lastName;
    user.nationalId = data.nationalId;
    user.dob = data.dob;
    user.email = data.email;
    user.phone = data.phone;
    await user.save();

    officer.badgeNumber = data.badgeNumber;
    officer.station = station._id;
    await officer.save();

    res.send("Officer updated.");
  },
);

router.delete("/:id", [auth, superAdmin], async (req, res) => {
  const officer = await Officer.findByIdAndDelete(req.params.id);
  if (!officer) return res.status(404).send("Officer not found.");

  const user = await User.findById(officer.user);
  user.isAdmin = false;
  await user.save();

  res.send("Officer deleted.");
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

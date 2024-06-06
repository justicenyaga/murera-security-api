const express = require("express");
const compression = require("compression");
const morgan = require("morgan");

const auth = require("../routes/auth");
const cases = require("../routes/cases");
const counties = require("../routes/counties");
const passwordReset = require("../routes/passwordReset");
const stations = require("../routes/stations");
const subcounties = require("../routes/subcounties");
const users = require("../routes/users");
const error = require("../middlewares/error");

module.exports = function (app) {
  app.use(morgan("tiny"));
  app.use(express.static("public"));
  app.use(express.static("views"));
  app.set("view engine", "ejs");
  app.use(express.json());
  app.use(compression());

  app.use("/api/auth", auth);
  app.use("/api/cases", cases);
  app.use("/api/counties", counties);
  app.use("/api/password-reset", passwordReset);
  app.use("/api/stations", stations);
  app.use("/api/subcounties", subcounties);
  app.use("/api/users", users);

  app.use(error);
};

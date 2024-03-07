const express = require("express");
const compression = require("compression");

const auth = require("../routes/auth");
const residents = require("../routes/residents.js");
const users = require("../routes/users");
const error = require("../middlewares/error");

module.exports = function (app) {
  app.use(express.static("public"));
  app.use(express.json());
  app.use(compression());

  app.use("/api/auth", auth);
  app.use("/api/residents", residents);
  app.use("/api/users", users);

  app.use(error);
};

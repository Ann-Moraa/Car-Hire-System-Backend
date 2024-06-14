const cors = require("cors");
const express = require("express");
const serveStatic = require("serve-static");

const auth = require("../routes/auth");
const cars = require("../routes/cars");
const error = require("../middlewares/error");
const users = require("../routes/users.js");

module.exports = function (app) {
  app.use(express.json());
  app.use(serveStatic("public", { acceptRanges: false }));
  app.use(cors({ origin: "*" }));
  app.use("/api/auth", auth);
  app.use("/api/cars", cars);
  app.use("/api/users", users);
  app.use(error);
};

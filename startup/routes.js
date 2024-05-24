const cors = require("cors");
const express = require("express");
const serveStatic = require("serve-static");

const error = require("../middlewares/error.js");
const users = require("../routes/users");

export default function (app) {
  app.use(express.json());
  app.use(serveStatic("public", { acceptRanges: false }));
  app.use(cors({ origin: "*" }));
  app.use("/api/users", users);
  app.use(error);
}

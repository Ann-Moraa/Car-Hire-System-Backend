const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const _ = require("lodash");

const { User, validateUser } = require("../models/user.js");
const validator = require("../middlewares/validate");

router.post("/", validator(validateUser), async (req, res) => {ss
  const { email, name, password } = req.body;
  let user = await service.findOne({ email });

  if (user) return res.status(400).send({ error: "Email is already taken" });

  user = new User({ name, email, password });
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();

  res
    .header("x-auth-token", user.generateAuthToken())
    .header("access-control-expose-headers", "x-auth-token")
    .send(_.omit(user, ["password"]));
});

router.get("/", async (_req, res) => {
  const users = await User.find({});

  res.send(users);
});

module.exports = router;

import express from "express";
import bcrypt from "bcrypt";
import _ from "lodash";

import { User } from "../models/user.js";

const router = express.Router();

router.post("/", validator(validate), async (req, res) => {
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
    .send(_.pick(user, ["_id", "name", "email"]));
});

router.get("/", async (_req, res) => {
  const users = await User.find({});

  res.send(users);
});

export default router;

import Joi from "joi";
import bcrypt from "bcrypt";
import express from "express";

import { User } from "../models/user";
import auth from "../middlewares/auth";
import validator from "../middlewares/validate";

const router = express.Router();

router.post("/", validator(validate), async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).send({ error: "Email isn't registered." });

  const isValidPassword = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!isValidPassword)
    return res.status(400).send({ error: "Invalid username and/or password." });

  const token = user.generateAuthToken();
  res.send(token);
});

router.get("/token", auth, async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user)
    return res.status(404).send({ error: "You don't exist on the database" });

  res.send(user.generateAuthToken());
});

function validate(req) {
  return Joi.object({
    password: Joi.string().min(5).max(1024).required(),
    username: Joi.string().min(3).max(50).required(),
  }).validate(req);
}

export default router;

import express from "express";

import { Car, validateCar } from "../models/car";
import auth from "../middlewares/auth";
import validator from "../middlewares/validate";

const router = express.Router();

router.post("/", [auth, validator(validateCar)], async (req, res) => {
  const { fuel, mileage, model, plate, selfDrive, type, year, images } =
    req.body;

  const car = new Car({
    fuel,
    lessee: req.user._id,
    mileage,
    model,
    images,
    plate,
    selfDrive,
    type,
    year,
  });

  await car.save();

  res.send(car);
});

router.get("/", async (_req, res) => {
  const cars = await Car.find({});

  res.send(cars);
});

export default router;

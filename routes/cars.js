const express = require("express");
const router = express.Router();

const { Car, validateCar } = require("../models/car.js");
const auth = require("../middlewares/auth.js");
const validator = require("../middlewares/validate.js");

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

module.exports = router;

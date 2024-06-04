import mongoose from "mongoose";
import Joi from "joi";

const schema = new mongoose.Schema({
  selfDrive: {
    type: Boolean,
    required: true,
  },
  fuel: {
    type: String,
    trim: true,
    required: true,
  },
  mileage: {
    type: String,
    required: true,
    trim: true,
  },
  model: {
    type: String,
    trim: true,
    required: true,
  },
  lessee: {
    required: true,
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  plate: {
    type: String,
    required: true,
    maxlength: 10,
    minlength: 7,
    trim: true,
  },
  type: {
    required: true,
    type: String,
    trim: true,
  },
  year: {
    required: true,
    type: Number,
  },
  images: [String],
});

export const Car = mongoose.model("Car", schema);

export const validateCar = (car) =>
  Joi.object({
    selfDrive: Joi.boolean().required(),
    fuel: Joi.string().required(),
    mileage: Joi.string().required(),
    model: Joi.string().required(),
    lessee: Joi.string().required(),
    plate: Joi.string().required(),
    type: Joi.string().required(),
    year: Joi.number().required(),
    images: Joi.array().min(1),
  }).validate(car);

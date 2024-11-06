const Joi = require("joi");
const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
  },
  name: {
    type: String,
    trim: true,
    minlength: 3,
    maxlength: 50,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 1024,
    trim: true,
  },
  timestamp: {
    type: Number,
    default: function () {
      return this._id.getTimestamp();
    },
  },
});

schema.methods.generateAuthToken = function () {
  return jwt.sign(
    { _id: this._id, name: this.name, email: this.email },
    process.env.jwtPrivateKey
  );
};

const User = mongoose.model("user", schema);

const validateUser = (user) =>
  Joi.object({
    email: Joi.string().min(3).max(100).required(),
    name: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).max(1024).required(),
  }).validate(user);

exports.User = User;
exports.validateUser = validateUser;

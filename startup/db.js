import mongoose from "mongoose";
import winston from "winston";

export default function () {
  mongoose
    .connect(process.env.db)
    .then(() => winston.info(`Connection to database is successful!`));
};

const mongoose = require("mongoose");
const winston = require("winston");

module.exports = function () {
  mongoose
    .connect(process.env.db)
    .then(() => winston.info(`Connection to database is successful!`))
    .catch((error) =>
      winston.error(`Error connecting to the databse ${error}`)
    );
};

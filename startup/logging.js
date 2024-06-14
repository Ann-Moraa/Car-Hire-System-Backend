const winston = require("winston");
require("winston-mongodb");
require("express-async-errors");

module.exports = function () {
  winston.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );

  new winston.Logger({
    transports: [
      new winston.transports.File({
        handleExceptions: true,
        handleRejections: true,
        filename: "uncaughtExceptions.log",
      }),
    ],
  });

  process.on("unhandledRejection", (ex) => {
    throw ex;
  });

  winston.configure({
    transports: [new winston.transports.File({ filename: "logfile.log" })],
  });
};

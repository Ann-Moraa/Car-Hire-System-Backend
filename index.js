const winston = require("winston");
const express = require("express");
const app = express();

require("./startup/config")();
require("./startup/db")();
require("./startup/logging")();
require("./startup/prod")(app);
require("./startup/routes")(app);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  winston.info(`Server is listening on port ${port}`)
);

module.exports = server;

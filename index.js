const winston = require("winston");
const express = require("express");
const app = express();

const logging = require("./startup/logging");
const routes = require("./startup/routes");
const db = require("./startup/db");
const config = require("./startup/config");
const prod = require("./startup/prod");

logging();
routes(app);
db();
config();
prod(app);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  winston.info(`Server is listening on port ${port}`)
);

module.exports = server;

const winston = require("winston");
const express = require("express");
const app = express();

const logging = require("./startup/logging");
// require("./startup/routes")(app);
// require("./startup/db")();
// require("./startup/config")();
// require("./startup/prod")(app);

console.log("Working");
logging();

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  winston.info(`Server is listening on port ${port}`)
);

module.exports = server;

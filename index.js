const winston = require("winston");
const express = require("express");
const app = express();

const logging = require("./startup/logging");
const routes = require("./startup/routes");
// require("./startup/db")();
// require("./startup/config")();
// require("./startup/prod")(app);

console.log("Init startup...");
logging();
routes(app);
console.log("Done initializing startup...");

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  winston.info(`Server is listening on port ${port}`)
);

module.exports = server;

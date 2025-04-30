const express = require("express");
const app = express();

const logging = require("./startup/logging");
const routes = require("./startup/routes");
const db = require("./startup/db");
const config = require("./startup/config");
const prod = require("./startup/prod");

config();
logging();
routes(app);
db();
prod(app);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(`Server is listening on port ${port}`)
);

console.log("app.listen() called.");
    
// Add this listener
process.on('exit', (code) => {
  console.log(`Process is exiting with code: ${code}`);
});

// Add a listener for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1); // Exit the process after logging
});

// Add a listener for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1); // Exit the process after logging
});

module.exports = server;

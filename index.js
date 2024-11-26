require('dotenv').config();
const express = require("express");
const app = express();
const cron = require('node-cron');

const logging = require("./startup/logging");
const routes = require("./startup/routes");
const db = require("./startup/db");
const config = require("./startup/config");
const prod = require("./startup/prod");
const {verify} = require("./utils/cron_jobs/transaction_verification")

config();
logging();
routes(app);
db();
prod(app);

// Schedule the cron job (run every minute)
// cron.schedule('* * * * *', verify);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(`Server is listening on port ${port}`)
);

module.exports = server;

import winston from "winston";
import express from "express";

import config from "./startup/config.js";
import db from "./startup/db.js";
import logging from "./startup/logging.js";
import prod from "./startup/prod.js";
import routes from "./startup/routes.js";

const app = express();

db();
config();
logging();
routes(app);
prod(app);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  winston.info(`Server is listening on port ${port}`)
);

export default server;

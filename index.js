import winston from "winston";
import express from "express";

import config from "./startup/config";
import db from "./startup/db";
import logging from "./startup/logging";
import prod from "./startup/prod";
import routes from "./startup/routes";

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

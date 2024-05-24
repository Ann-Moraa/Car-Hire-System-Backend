import winston from "winston";
import express from "express";

import db from "./startup/db";
import logging from "./startup/logging";
import routes from "./startup/routes";

const app = express();

db();
logging();
routes(app);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  winston.info(`Server is listening on port ${port}`)
);

export default server;

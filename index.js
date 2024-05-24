import winston from "winston";
import express from "express";

import routes from "./startup/routes";
import db from "./startup/db";

const app = express();

db();
routes(app);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  winston.info(`Server is listening on port ${port}`)
);

export default server;

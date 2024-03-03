const express = require("express");
const app = express();
const logger = require("./logger");

const port = process.env.PORT || 3000;
app.listen(port, () => logger.info(`Listening on port ${port}...`));

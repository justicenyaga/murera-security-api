const express = require("express");
const app = express();
const logger = require("./logger");

require("./startup/config")();
require("./startup/validation")();
require("./startup/db")();
require("./startup/routes")(app);

const port = process.env.PORT || 3000;
app.listen(port, () => logger.info(`Listening on port ${port}...`));

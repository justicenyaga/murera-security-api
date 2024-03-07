const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const outputFolder = "public/images";

module.exports = async (req, res, next) => {
  const file = req.file;

  if (!file) return res.status(400).send("No image file uploaded.");

  const filename = file.filename + ".jpg";

  await sharp(file.path)
    .resize(500, 500)
    .jpeg({ quality: 50 })
    .toFile(path.resolve(outputFolder, filename));

  fs.unlinkSync(file.path);

  req.image = filename;

  next();
};

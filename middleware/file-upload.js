const multer = require("multer");
const { v4: uuidV4 } = require("uuid");
const path = require("path");

const MINE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const fileUpload = multer({
  limits: 500000,
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "../uploads/images"));
    },
    filename: (req, file, cb) => {
      const ext = MINE_TYPE_MAP[file.mimetype];
      cb(null, uuidV4() + "." + ext);
    },
    fileFilter: (req, file, cb) => {
      const isValid = !!MINE_TYPE_MAP[file.mimetype];
      let error = isValid ? null : new Error("Invalid mime type!");
      cb(error, isValid);
    },
  }),
});

module.exports = fileUpload;

const fs = require("fs");
const path = require("path");

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoute = require("./routes/places-route");
const usersRoute = require("./routes/users-route");
const HttpError = require("./models/http-error");

const app = express();

app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use(cors());

app.use("/api/places", placesRoute);
app.use("/api/users", usersRoute);

app.use((req, res, next) => {
  const err = new HttpError("Could not find this route", 404);
  throw err;
});

app.use((err, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => console.log(err));
  }

  if (res.headersSent) {
    return next(err);
  }
  res
    .status(err.code || 500)
    .json({ message: err.message || "An unknown error occurred!" });
});

const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.5pjzkq0.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;
mongoose
  .connect(url)
  .then(() => {
    console.log("Connected Success!!");
    app.listen(process.env.PORT || 8080);
  })
  .catch((err) => console.log(err));

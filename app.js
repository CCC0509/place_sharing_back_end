const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoute = require("./routes/places-route");
const usersRoute = require("./routes/users-route");
const HttpError = require("./models/http-error");

const app = express();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_API_KEY,
    secretAccessKey: process.env.AWS_API_SECRET_KEY,
  },
  sslEnabled: false,
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

const bucketName = process.env.AWS_BUCKET;

app.use(bodyParser.json());

app.use(cors());

app.use("/api/places", placesRoute);
app.use("/api/users", usersRoute);

app.use((req, res, next) => {
  const err = new HttpError("Could not find this route", 404);
  throw err;
});

app.use((err, req, res, next) => {
  console.log(err);
  if (req.file && req.file.key) {
    const params = {
      Bucket: bucketName,
      Key: req.file.key,
    };
    const command = new DeleteObjectCommand(params);

    s3.send(command)
      .then((data) => {
        console.log("File deleted:", req.file.key);
        next();
      })
      .catch((deleteErr) => {
        console.error("Error deleting file:", deleteErr);
        next(deleteErr);
      });
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

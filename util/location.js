const axios = require("axios");
const HttpError = require("../models/http-error");

const API_KEY = process.env.GOOGLE_API_KEY;

async function getCoordsForAddress(address) {
  const reaponse = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );
  const data = reaponse.data;

  if (!data || data.status === "ZERO_RESULTS") {
    throw new HttpError("Could not find location for the specified address.");
  }
  const location = data.results[0].geometry.location;
  return location;
}

module.exports = getCoordsForAddress;

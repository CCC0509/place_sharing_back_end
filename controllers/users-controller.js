const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let allUsers;
  try {
    allUsers = await User.find({}, `-password`).exec();
  } catch (error) {
    return next(new HttpError("Something went wrong, could not get any user!"));
  }

  res
    .status(200)
    .json({ users: allUsers.map((u) => u.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    return next(new HttpError("InValid data...", 422));
  }
  const { name, email, password } = req.body;
  let hasUser;
  try {
    hasUser = await User.findOne({ email: email });
  } catch (error) {
    return next(
      new HttpError("Signing up failed, please try again later.", 500)
    );
  }

  if (hasUser) {
    return next(
      new HttpError("User exsits already, please login instead.", 422)
    );
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    return next(new HttpError("Could not create user, please try again.", 500));
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
    places: [],
  });
  try {
    await createdUser.save();
  } catch (error) {
    return next(new HttpError("Signing up failed, please try again.", 500));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (error) {
    return next(new HttpError("Signing up failed, please try again.", 500));
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let findUser;
  try {
    findUser = await User.findOne({ email: email }).exec();
  } catch (error) {
    return next(new HttpError("Login failed, please try again later!"));
  }

  if (!findUser) {
    return next(
      new HttpError("Invalid credentials, could not log you in.", 401)
    );
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, findUser.password);
  } catch (error) {
    return next(
      new HttpError("Invalid credentials, could not log you in.", 500)
    );
  }

  if (!isValidPassword) {
    return next(
      new HttpError("Wrong email or password, please try again.", 401)
    );
  }

  let token;
  try {
    token = jwt.sign(
      { userId: findUser.id, email: findUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (error) {
    return next(new HttpError("Logging in failed, please try again.", 500));
  }

  res.json({ userId: findUser.id, email: findUser.email, token: token });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;

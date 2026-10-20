import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const PIN_REGEX = /^\d{4}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{2,20}$/;

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "90d" });

// Checks whether a username is already registered, so the app can decide
// whether to show the "create account" or "welcome back" flow.
export const checkUsername = async (req, res) => {
  try {
    const username = String(req.params.username || "").toLowerCase().trim();
    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({ message: "Enter a valid username (2-20 letters, numbers, underscore)" });
    }
    const existing = await User.findOne({ username });
    res.json({ exists: !!existing });
  } catch (error) {
    console.error("Error in checkUsername controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const register = async (req, res) => {
  try {
    const username = String(req.body.username || "").toLowerCase().trim();
    const pin = String(req.body.pin || "");

    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({ message: "Enter a valid username (2-20 letters, numbers, underscore)" });
    }
    if (!PIN_REGEX.test(pin)) {
      return res.status(400).json({ message: "PIN must be exactly 4 digits" });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: "That username is already taken" });
    }

    const pinHash = await bcrypt.hash(pin, 10);
    const user = await User.create({ username, pinHash, displayName: username });

    const token = signToken(user._id);
    res.status(201).json({ token, user: { id: user._id, username: user.username } });
  } catch (error) {
    console.error("Error in register controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const username = String(req.body.username || "").toLowerCase().trim();
    const pin = String(req.body.pin || "");

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "No account with that username" });
    }

    const match = await bcrypt.compare(pin, user.pinHash);
    if (!match) {
      return res.status(401).json({ message: "Incorrect PIN" });
    }

    const token = signToken(user._id);
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (error) {
    console.error("Error in login controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-pinHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (error) {
    console.error("Error in me controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

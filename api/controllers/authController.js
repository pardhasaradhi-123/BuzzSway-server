// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Register
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    // ✅ Create token here too
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // ✅ Set token as HTTP-only cookie
    res
      .cookie("token", token, {
        httpOnly: false,
        secure: true, // set to true if using https
        sameSite: "Lax", // or "None" for cross-site
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(201)
      .json({
        user: { id: user._id, username: user.username },
        token, // ✅ frontend expects this!
      });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error });
  }
};

// Login
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // ✅ Set token as HTTP-only cookie
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: false, // true if using HTTPS
        sameSite: "Lax", // or "None" if frontend on different domain
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(200)
      .json({ user: { id: user._id, username: user.username } }); // optional token here
  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
};

module.exports = { registerUser, loginUser };

// src/routes/user.routes.js
const express = require("express");
const multer = require("multer");
const { protect } = require("../middlewares/auth.middleware");
const {
  getUsers,
  signup,
  getMe,
  checkUsername,
  getUserByUsername,
  updateUser,
  checkEmail,         // <-- import it
} = require("../controllers/user.controller");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// New: email‐check endpoint
router.get("/check-email", checkEmail);

router.post("/signup", upload.single("profilePic"), signup);
router.get("/", protect, getUsers);
router.get("/me", protect, getMe);
router.get("/check-username", checkUsername);
router.put("/update", protect, upload.single("profilePic"), updateUser);
router.get("/:username", getUserByUsername);

module.exports = router;
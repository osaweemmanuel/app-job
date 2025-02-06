// userProfileRoutes.js

const express = require("express");
const router = express.Router();
const userProfileController = require("../controllers/userProfileController");

// Create a new user profile
router.post("/", userProfileController.createUserProfile);

// Get user profile by user ID
router.get("/:userId", userProfileController.getUserProfileByUserId);

// Update user profile by user ID
router.patch(
  "/:userId/:index?",
  userProfileController.updateUserProfileByUserId
);

// Delete user profile by user ID
router.delete("/:userId", userProfileController.deleteUserProfileByUserId);

module.exports = router;

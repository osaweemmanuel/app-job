// userProfileController.js

const UserProfile = require("../models/UserProfile");

// Create a new user profile
exports.createUserProfile = async (req, res) => {
  try {
    const userProfile = new UserProfile(req.body);
    await userProfile.save();
    res.status(201).json(userProfile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get user profile by user ID
exports.getUserProfileByUserId = async (req, res) => {
  try {
    const userProfile = await UserProfile.findOne({ user: req.params.userId });
    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }
    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile by user ID
exports.updateUserProfileByUserId = async (req, res) => {
  try {
    const index = req.params.index;
    const userId = req.params.userId;

    if (index) {
      const userProfile = await UserProfile.findOne({ user: userId });

      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }

      // Update the certifications array based on the provided index
      userProfile.certifications.splice(index, 1);

      // Save the updated user profile
      const updatedUserProfile = await userProfile.save();

      res.json(updatedUserProfile);
    } else {
      const userProfile = await UserProfile.findOneAndUpdate(
        { user: userId },
        req.body,
        { new: true }
      );
      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      res.json(userProfile);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete user profile by user ID
exports.deleteUserProfileByUserId = async (req, res) => {
  try {
    const userProfile = await UserProfile.findOneAndDelete({
      user: req.params.userId,
    });
    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }
    res.json({ message: "User profile deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

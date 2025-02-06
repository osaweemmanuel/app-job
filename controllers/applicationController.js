// controllers/applicationController.js

const Application = require("../models/JobApp");
const Job = require("../models/Job");
const UserProfileModel = require("../models/UserProfile");
const { sendUserDetails, sendSuccessMessage } = require("../helpers/applied");

// Create a new application
async function createApplication(req, res) {
  try {
    const application = new Application(req.body);
    await application.save();

    // Retrieve user profile and job details based on application data
    const userProfile = await UserProfileModel.findOne({
      user: req.body.userId,
    });
    const jobDetails = await Job.findById(req.body.jobId);

    // Send user details and job details via email
    await sendUserDetails(userProfile, jobDetails);
    await sendSuccessMessage(userProfile, jobDetails);

    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// Get all applications
async function getAllApplications(req, res) {
  try {
    const applications = await Application.find();
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get an application by ID
async function getApplicationById(req, res) {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Update an application by ID
async function updateApplication(req, res) {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    res.json(application);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// Delete an application by ID
async function deleteApplication(req, res) {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    res.json({ message: "Application deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function checkIfUserApplied(req, res) {
  try {
    const userId = req.params.userId;
    const jobId = req.params.jobId;

    const application = await Application.findOne({ userId, jobId });

    if (application) {
      res.json({ applied: true });
    } else {
      res.json({ applied: false });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get all jobs applied by a specific user
async function getAppliedJobsByUserId(req, res) {
  try {
    const userId = req.params.userId;
    // Find all applications where userId matches
    const applications = await Application.find({ userId });
    // Extract the jobIds from applications
    const jobIds = applications.map((application) => application.jobId);
    // Fetch details of jobs with these jobIds
    // Assuming Job model is imported and exists
    const jobs = await Job.find({ _id: { $in: jobIds } });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createApplication,
  getAllApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  checkIfUserApplied,
  getAppliedJobsByUserId,
};

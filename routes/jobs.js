// routes/jobs.js

const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const User = require("../models/User");
const Application = require("../models/JobApp");
const { sendAssignmentEmail, sendNewJobEmail } = require("../helpers/applied");

// GET all jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a specific job
router.get("/:id", getJob, (req, res) => {
  res.json(res.job);
});

// CREATE a new job
router.post("/", async (req, res) => {
  const job = new Job(req.body);
  try {
    const newJob = await job.save();
    const userEmails = await User.find({}, "email");
    const emails = userEmails.map((user) => user.email);
    await sendNewJobEmail(emails, newJob);
    res.status(201).json(newJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE a job
// PATCH route to update a job by its unique identifier
router.patch("/:id", getJob, async (req, res) => {
  try {
    // Update all fields provided in the request body
    Object.assign(res.job, req.body);
    const updatedJob = await res.job.save();
    res.json(updatedJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a job
router.delete("/:id", getJob, async (req, res) => {
  try {
    // Ensure that res.job is an instance of the Job model
    if (!(res.job instanceof Job)) {
      return res.status(400).json({ message: "Invalid job object" });
    }

    // Delete all applications associated with the job
    await Application.deleteMany({ jobId: res.job._id });

    // Delete the job
    await res.job.deleteOne();

    res.json({ message: "Job and associated applications deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware to fetch job by ID
async function getJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (job == null) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.job = job;
    next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Add a new route to assign a job to a user
router.patch("/:id/assign/:userId", getJob, async (req, res) => {
  try {
    // Ensure that the user exists
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Assign the job to the user
    res.job.assignedTo = req.params.userId;
    const updatedJob = await res.job.save();

    // Send congratulations email to the user
    await sendAssignmentEmail(user.email, updatedJob);

    res.json(updatedJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Modify the route to update a job to include assigning the job to a user
router.patch("/:id", getJob, async (req, res) => {
  try {
    // Update all fields provided in the request body
    Object.assign(res.job, req.body);

    // Optionally, assign the job to a user if specified in the request body
    if (req.body.assignedTo) {
      res.job.assignedTo = req.body.assignedTo;
    }

    const updatedJob = await res.job.save();
    res.json(updatedJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Optionally, add routes to remove assignments if needed
router.patch("/:id/removeAssignment", getJob, async (req, res) => {
  try {
    res.job.assignedTo = null;
    const updatedJob = await res.job.save();
    res.json(updatedJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find all applications where userId matches
    const applications = await Application.find({ userId });

    // Extract the jobIds from applications
    const jobIds = applications.map((application) => application.jobId);

    // Fetch details of jobs with these jobIds
    const jobs = await Job.find({ _id: { $in: jobIds } });

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/applicants/:jobId", async (req, res) => {
  const jobId = req.params.jobId;

  try {
    // Find all job applications for this job
    const jobApplications = await Application.find({ jobId });

    // Extract user IDs from job applications
    const userIds = jobApplications.map((application) => application.userId);

    // Find users who applied for this job
    const users = await User.find({ _id: { $in: userIds } });

    res.status(200).json(users);
  } catch (error) {
    console.error("Error getting applicants:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

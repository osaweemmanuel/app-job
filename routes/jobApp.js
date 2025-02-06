// routes/applicationRoutes.js

const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");

// Route to create a new application
router.post("/", applicationController.createApplication);

// Route to get all applications
router.get("/", applicationController.getAllApplications);

// Route to get an application by ID
router.get("/:id", applicationController.getApplicationById);

// Route to update an application by ID
router.put("/:id", applicationController.updateApplication);

// Route to delete an application by ID
router.delete("/:id", applicationController.deleteApplication);

// Route to check if a user has applied for a role
router.get("/:userId/:jobId", applicationController.checkIfUserApplied);

router.get("/:userId/applied", applicationController.getAppliedJobsByUserId);

module.exports = router;

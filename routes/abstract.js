// routes/applicationRoutes.js

const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");

router.get("/:userId", applicationController.getAppliedJobsByUserId);

module.exports = router;

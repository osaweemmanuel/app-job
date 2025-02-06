const multer = require("multer");
const fs = require("fs");
const express = require("express");
const router = express.Router();
const { sendEmailWithScreenshot } = require("../helpers/applied");

const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("screenshot"), async (req, res) => {
  try {
    const file = fs.readFileSync(req.file.path);
    const base64Image = file.toString("base64");
    // Send email with screenshot attached
    await sendEmailWithScreenshot(base64Image);

    res.status(200).send("Screenshot submitted successfully!");
  } catch (error) {
    console.error("Error submitting screenshot:", error);
    res.status(500).send("Failed to submit screenshot.");
  }
});

module.exports = router;

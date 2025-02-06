const express = require("express");
const router = express.Router();
const {
  sendEmployerDataEmail,
  sendContactFormEmail,
} = require("../helpers/applied");
const multer = require("multer");
const upload = multer();

// Define your route handler
router.post("/employer", upload.none(), async (req, res) => {
  try {
    // Create email message body
    const emailContent = `
      Company's Name: ${req.body["Company's Name"]}
      Industry: ${req.body.Industry}
      State/Province: ${req.body["State/Province"]}
      City: ${req.body.City}
      Job Title: ${req.body["Job Title"]}
      Number of Positions: ${req.body["Number of Positions"]}
      Skills and Certifications: ${req.body["Skills and Certifications"]}
      Preferred Start Date: ${req.body["Preferred Start Date"]}
      Contact Person: ${req.body["Contact Person"]}
      Email Address: ${req.body["Email Address"]}
      Phone Number: ${req.body["Phone Number"]}
      Best Time to Call: ${req.body["Best Time to call"]}
      Additional Details: ${req.body["Additional Details"]}
    `;
    // Send email
    await sendEmployerDataEmail(emailContent);

    // Optionally, you can send a response to the client
    res.status(200).json({ message: "Employer data submitted successfully" });
  } catch (error) {
    // Handle errors
    console.error("Error submitting employer data:", error);
    res
      .status(500)
      .json({ message: "An error occurred while submitting employer data" });
  }
});

// Define your route handler
router.post("/", upload.none(), async (req, res) => {
  try {
    // Create email message body
    const emailContent = `
      Name: ${req.body.Name}
      Email: ${req.body.Email}
      Subject: ${req.body.Subject}
      Message: ${req.body.Message}
      Job Seeker or Employer: ${req.body["JobSeeker or Employer"]}
    `;

    // Send email
    await sendContactFormEmail(emailContent);

    // Optionally, you can send a response to the client
    res.status(200).json({ message: "Contact form submitted successfully" });
  } catch (error) {
    // Handle errors
    console.error("Error submitting contact form:", error);
    res
      .status(500)
      .json({ message: "An error occurred while submitting contact form" });
  }
});

module.exports = router;

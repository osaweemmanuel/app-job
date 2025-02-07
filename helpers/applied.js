const nodemailer = require("nodemailer");

const sendUserDetails = async (userProfile, jobDetails) => {
  try {
    let transporter = nodemailer.createTransport({
      pool: true,
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });

    const htmlTemplate = `
        <html>
        <body style="text-align: left; max-width:100%; font-family: Arial, sans-serif;">
          <h1>Job application received!</h1>
          <h1>User Profile Details</h1>
          ${
            userProfile.firstName &&
            `<p>First Name: ${userProfile.firstName}</p>`
          }
          ${userProfile.lastName && `<p>Last Name: ${userProfile.lastName}</p>`}
          ${userProfile.email && `<p>Email: ${userProfile.email}</p>`}
          ${
            userProfile.phoneNumber &&
            `<p>Phone Number: ${userProfile.phoneNumber}</p>`
          }
          ${userProfile.role && `<p>Role: ${userProfile.role}</p>`}
          ${
            userProfile.streetAddress &&
            `<p>Street Address: ${userProfile.streetAddress}</p>`
          }
          ${
            userProfile.streetAddressLine2 &&
            `<p>Street Address Line 2: ${userProfile.streetAddressLine2}</p>`
          }
          ${userProfile.city && `<p>City: ${userProfile.city}</p>`}
          ${
            userProfile.stateProvince &&
            `<p>State/Province: ${userProfile.stateProvince}</p>`
          }
          ${
            userProfile.preferredJobType &&
            `<p>Preferred Job Type: ${userProfile.preferredJobType}</p>`
          }
          ${
            userProfile.preferredLocations &&
            `<p>Preferred Locations: ${userProfile.preferredLocations}</p>`
          }
          ${
            userProfile.availableStartDate &&
            `<p>Available Start Date: ${userProfile.availableStartDate}</p>`
          }
          ${
            userProfile.availability &&
            `<p>Availability: ${userProfile.availability.join(", ")}</p>`
          }
          ${
            userProfile.daysAvailable &&
            `<p>Days Available: ${userProfile.daysAvailable.join(", ")}</p>`
          }
          ${
            userProfile.methodOfTransportation &&
            `<p>Method of Transportation: ${userProfile.methodOfTransportation.join(
              ", "
            )}</p>`
          }
          ${
            userProfile.additionalNotes &&
            `<p>Additional Notes: ${userProfile.additionalNotes}</p>`
          }
          ${
            userProfile.yearsOfConstructionExperience &&
            `<p>Years of Construction Experience: ${userProfile.yearsOfConstructionExperience}</p>`
          }
          ${
            userProfile.otherExperience &&
            `<p>Other Experience: ${userProfile.otherExperience.join(", ")}</p>`
          }
          ${
            userProfile.equipmentsOwned &&
            `<p>Equipments Owned: ${userProfile.equipmentsOwned.join(", ")}</p>`
          }
          <h1>Job Details</h1>
          ${jobDetails.title && `<p>Title: ${jobDetails.title}</p>`}
          ${jobDetails.address && `<p>Address: ${jobDetails.address}</p>`}
          ${
            jobDetails.compensation &&
            `<p>Compensation: ${jobDetails.compensation}</p>`
          }
          ${
            jobDetails.department &&
            `<p>Department: ${jobDetails.department}</p>`
          }
          ${
            jobDetails.employmentType &&
            `<p>Employment Type: ${jobDetails.employmentType}</p>`
          }
          ${
            jobDetails.minimumExperience &&
            `<p>Minimum Experience: ${jobDetails.minimumExperience}</p>`
          }
        </body>
        </html>
    `;
    // Create an array to store the attachments
    const attachments = [];

    // Iterate over each certification and attach its PDF
    userProfile.certifications.forEach((certification, index) => {
      // Convert base64Pdf to a buffer
      const pdfBuffer = Buffer.from(certification.base64Pdf, "base64");

      // Define the attachment options
      const attachment = {
        filename: certification.originalname, // Use a unique filename
        content: pdfBuffer,
      };

      // Push the attachment to the attachments array
      attachments.push(attachment);
    });

    // Define the mail options
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: process.env.SENDER_EMAIL, // Change to the recipient email address
      subject: "Job application received!",
      html: htmlTemplate,
      attachments: attachments, // Attach the certifications
    };

    const result = await transporter.sendMail(mailOptions);

    console.log("Email sent:", result);

    return "Job application email sent successfully";
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
const sendSuccessMessage = async (userProfile, jobDetails) => {
  try {
    let transporter = nodemailer.createTransport({
      pool: true,
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });

    const htmlTemplate = `
        <html>
        <body style="text-align: left; max-width:100%; font-family: Arial, sans-serif;">
        <h1>Hey ${userProfile.firstName},</h1>
        <p>Your Job application for the position ${jobDetails.title} was received, Our personnel will reach out to you if you are choosen for the role</p>
        </body>
        </html>
    `;

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: userProfile.email,
      subject: "Job application received!",
      html: htmlTemplate,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log("Email sent:", result);

    return "Job application email sent successfully";
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
const sendAssignmentEmail = async (userEmail, jobDetails) => {
  try {
    let transporter = nodemailer.createTransport({
      pool: true,
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });
    const signinPage = `${process.env.VITE_FRONTEND_URL}/signin`;
    const htmlTemplate = `
        <html>
        <body style="max-width:100%; font-family: Arial, sans-serif;">
          <h1>Congratulations!</h1>
          <p>You have been successfully assigned to a new role:</p>
          <h2>Job Details</h2>
          <p>Title: ${jobDetails.title}</p>
          <p>Address: ${jobDetails.address}</p>
          <p>Compensation: ${jobDetails.compensation}</p>
          <p>Department: ${jobDetails.department}</p>
          <p>Employment Type: ${jobDetails.employmentType}</p>
          <p>Minimum Experience: ${jobDetails.minimumExperience}</p>
          <h1>Login to your account to view more details in the <a href="${signinPage}" style="color: #333; font-size: 24px;">Job Openings page</a></h1>
        </body>
        </html>
    `;

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: userEmail,
      subject: "Congratulations! You've been assigned a new role",
      html: htmlTemplate,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log("Email sent:", result);

    return "Assignment email sent successfully";
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const sendNewJobEmail = async (userEmails, jobDetails) => {
  try {
    let transporter = nodemailer.createTransport({
      pool: true,
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });
    const signinPage = `${process.env.VITE_FRONTEND_URL}/signin`;
    const htmlTemplate = `
        <html>
        <body style="max-width:100%; font-family: Arial, sans-serif;">
          <h1>New Job Uploaded!</h1>
          <p>A new job has been uploaded to our platform:</p>
          <h2>Job Details</h2>
          <p>Title: ${jobDetails.title}</p>
          <p>Address: ${jobDetails.address}</p>
          <p>Compensation: ${jobDetails.compensation}</p>
          <p>Department: ${jobDetails.department}</p>
          <p>Employment Type: ${jobDetails.employmentType}</p>
          <p>Minimum Experience: ${jobDetails.minimumExperience}</p>
          <h1>Login to your account to view more details in the <a href="${signinPage}" style="color: #333; font-size: 24px;">Job Openings page</a></h1>
        </body>
        </html>
    `;

    const mailOptionsPromises = userEmails.map(async (userEmail) => {
      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: userEmail,
        subject: "New Job Uploaded to Platform",
        html: htmlTemplate,
      };
      return transporter.sendMail(mailOptions);
    });

    const results = await Promise.all(mailOptionsPromises);
    console.log("Emails sent:", results);

    return "New job emails sent successfully";
  } catch (error) {
    console.error("Error sending emails:", error);
    throw error;
  }
};

const sendEmailWithScreenshot = async (screenshotData) => {
  try {
    let transporter = nodemailer.createTransport({
      pool: true,
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: process.env.SENDER_EMAIL,
      subject: "User filled out timesheet and submitted",
      html: "<p>Attached is a filled copy of the weekly timesheet</p>",
      attachments: [
        {
          filename: "Timesheet.png", // or .jpg, .jpeg, etc. based on the format
          content: screenshotData,
          encoding: "base64",
        },
      ],
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);

    console.log("Email sent:", result);

    return "Timesheet successfully submitted!";
  } catch (error) {
    console.error("Error sending emails:", error);
    throw error;
  }
};

// Function to send email with employer data
const sendEmployerDataEmail = async (emailContent) => {
  try {
    // Create nodemailer transporter
    let transporter = nodemailer.createTransport({
      pool: true,
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });

    // Define email options
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: process.env.RECIPIENT_EMAIL, // Update with the recipient email address
      subject: "Employer Data Submission",
      text: emailContent,
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent:", result);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// Function to send email with contact form data
const sendContactFormEmail = async (emailContent) => {
  try {
    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      pool: true,
      host: process.env.EMAIL_HOST, 
      port: 465, 
      secure: true, // true for port 465, false for other ports
      auth: {
        user: process.env.SENDER_EMAIL, // Sender email from environment variable
        pass: process.env.APP_PASSWORD, // App password or SMTP password
      },
    });

    // Define email options
    const mailOptions = {
      from: process.env.SENDER_EMAIL, // Sender email address
      to: process.env.RECIPIENT_EMAIL, // Recipient email address
      subject: "Employer Data Submission", // Email subject
      text: emailContent, // Plain text body
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Optionally rethrow for handling at a higher level
  }
};


module.exports = {
  sendUserDetails,
  sendSuccessMessage,
  sendAssignmentEmail,
  sendNewJobEmail,
  sendEmailWithScreenshot,
  sendEmployerDataEmail,
  sendContactFormEmail,
};

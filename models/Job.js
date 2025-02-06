const mongoose = require("mongoose");
const { Schema } = mongoose;

const JobSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  timePosted: {
    type: Date,
    default: Date.now,
  },
  address: {
    type: String,
    required: true,
  },
  compensation: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  employmentType: {
    type: String,
    enum: ["Full-time", "Part-time", "Contract", "Freelance"],
    required: true,
  },
  minimumExperience: {
    type: Number,
    required: true,
  },
  jobDescriptionPdf: {
    data: String, // Store PDF data as Buffer
    contentType: String, // Store PDF MIME type
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: "User", // Reference to User model
    default: null,
  },
});

const JobModel = mongoose.model("Job", JobSchema);

module.exports = JobModel;

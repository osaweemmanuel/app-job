const mongoose = require("mongoose");
const { Schema } = mongoose;

// Application model
const ApplicationSchema = new Schema({
  jobId: {
    type: Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fullname: {
    type: String,
    required: true,
  },
});

const ApplicationModel = mongoose.model("Application", ApplicationSchema);

module.exports = ApplicationModel;

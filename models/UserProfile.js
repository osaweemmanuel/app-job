const mongoose = require("mongoose");
const { Schema } = mongoose;

const userProfileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  email: {
    type: String,
  },
  role: {
    type: String,
  },
  streetAddress: {
    type: String,
  },
  streetAddressLine2: {
    type: String,
  },
  city: {
    type: String,
  },
  stateProvince: {
    type: String,
  },
  preferredJobType: {
    type: String,
  },
  preferredLocations: {
    type: String,
  },
  availableStartDate: {
    type: String,
  },
  availability: {
    type: [String],
  },
  daysAvailable: {
    type: [String],
  },
  methodOfTransportation: {
    type: [String],
  },
  additionalNotes: {
    type: String,
  },
  yearsOfConstructionExperience: {
    type: Number,
  },
  otherExperience: {
    type: [String],
  },
  equipmentsOwned: {
    type: [String],
  },
  certifications: [
    {
      originalname: String,
      mimetype: String,
      base64Pdf: String,
    },
  ],
});

const UserProfileModel = mongoose.model("UserProfile", userProfileSchema);

module.exports = UserProfileModel;

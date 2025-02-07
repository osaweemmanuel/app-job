// const mongoose = require("mongoose");

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//   } catch (err) {
//     console.log(err);
//   }
// };

// module.exports = connectDB;



const mongoose = require("mongoose");
const { logEvents } = require("./../middleware/logger"); // Adjust path as needed

const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI; // Ensure MONGO_URI is defined

  if (!MONGODB_URI) {
    console.error("MONGO_URI is not defined. Please set it in the environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);

    logEvents(
      `${err.no || "N/A"}: ${err.code || "N/A"}\t${err.syscall || "N/A"}\t${err.hostname || "N/A"}`,
      "mongoErrLog.log"
    );
    process.exit(1); // Exit the process if the database connection fails
  }
};

// MongoDB connection error handling
mongoose.connection.on("error", (err) => {
  console.error("MongoDB Error:", err);

  logEvents(
    `${err.no || "N/A"}: ${err.code || "N/A"}\t${err.syscall || "N/A"}\t${err.hostname || "N/A"}`,
    "mongoErrLog.log"
  );
});

module.exports = connectDB;

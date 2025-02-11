require("dotenv").config();
require("express-async-errors");
const express = require("express");
const app = express();
const path = require("path");
const { logger, logEvents } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const connectDB = require("./config/dbConn");
const mongoose = require("mongoose");
const PORT = process.env.PORT || 3500;

console.log(process.env.NODE_ENV === 'production');

connectDB();

app.use(logger);

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

app.use(bodyParser.json({ limit: "600mb" }));
app.use(bodyParser.urlencoded({ limit: "600mb", extended: true }));
app.use(bodyParser.text({ limit: "600mb" }));
app.use(cookieParser());

app.use("/", express.static(path.join(__dirname, "public")));

app.use("/auth", require("./routes/authRoutes"));
app.use("/jobs", require("./routes/jobs"));
app.use("/timesheet", require("./routes/timesheet"));
app.use("/userProfiles", require("./routes/userProfileRoutes"));
app.use("/jobApp", require("./routes/jobApp"));
app.use("/jobApplied", require("./routes/abstract"));
app.use("/upload", require("./routes/upload"));
app.use("/contact", require("./routes/contact"));


app.get('/',(req,res)=>{
  res.send("The app is working, we can test the app now")
});


app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});
app.options('*', cors(corsOptions));
app.use(errorHandler);



mongoose.connection.once("open", () => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

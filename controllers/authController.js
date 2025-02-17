const User = require("../models/User");
const Token = require("../models/Token");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { OAuth2Client } = require("google-auth-library");
const {
  sendVerificationEmail,
  hashPassword,
  comparePassword,
  sendOTPEmail,
  generateRandomToken,
} = require("../helpers/auth");
require("dotenv").config();

// Google OAuth Config
const oauth2Client = new OAuth2Client(
  process.env.GO_CLIENT_ID,
  process.env.GO_CLIENT_SECRET,
  process.env.GO_REDIRECT_URI
);

// @desc Register
// @route POST /auth
// @access Public
const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name) {
      console.log(`Name required for ${email}`);
      return res.json({
        error: "Name is Required",
      });
    }
    if (!password || password.length < 10) {
      console.log(`Password required or below 10 characters: ${email}`);
      return res.json({
        error: "Password is Required and should be at least 10 characters long",
      });
    }
    const exist = await User.findOne({ email });
    if (exist) {
      console.log(`User with email ${email} already exists`);
      return res.json({
        error: "Email is already taken",
      });
    }

    const hashedpassword = await hashPassword(password);

    const user = await User.create({
      username: name,
      email: email,
      password: hashedpassword,
    });

    const newOTP = generateRandomToken();

    const token = await Token.create({
      email: user.email,
      token: newOTP,
      purpose: "email",
    });

    await sendVerificationEmail(user.email, newOTP);

    console.log(token, user);
    return res.json({
      status: 200,
      message: "Registered Successfully",
    });
  } catch (error) {
    console.log(error);
  }
};

// @desc Login
// @route POST /auth
// @access Public
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const foundUser = await User.findOne({ email }).exec();

  if (!foundUser || !foundUser.active) {
    return res.status(401).json({ error: "You are not registered" });
  }

  if (!foundUser.verified) {
    await createNewLink(req, res);
    return res.status(402).json({ error: "You are not verified" });
  }

  const PasswordsMatch = await comparePassword(password, foundUser.password);

  if (!PasswordsMatch) return res.status(401).json({ message: "Unauthorized" });

  const accessToken = jwt.sign(
    {
      UserInfo: {
        userId: foundUser._id,
        verified: foundUser.verified,
        email: foundUser.email,
        username: foundUser.username,
        roles: foundUser.roles,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { username: foundUser.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  // Create secure cookie with refresh token
  res.cookie("jwt", refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: "None", //cross-site cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
  });

  // Send accessToken containing username and roles
  res.json({ accessToken });
};






const GoogleHandler = (req, res) => {
  // Generate the Google OAuth URL for authorization
  const redirectUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",  // To get refresh token
    prompt: "consent",      // Forces consent screen on each login
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",   // Access user email
      "https://www.googleapis.com/auth/userinfo.profile", // Access user profile
    ],
  });

  // Redirect to Google for OAuth authentication
  res.redirect(redirectUrl);
};



const GoogleCallback = async (req, res) => {
  try {
    const { code } = req.query; // Get the code from the query params
    console.log("Received code:", code);

    // Exchange the code for an access token
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user info from Google using the access token
    const { data } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    // Check if user exists in DB by email
    let user = await User.findOne({ email: data.email }).exec();

    if (!user) {
      // If user doesn't exist, create a new user with Google data
      user = await User.create({
        username: data.name,
        email: data.email,
        verified: true, // Assume email is verified
        isGoogleUser: true, // Flag to identify Google login
      });
    }

    // Generate access and refresh tokens for session management
    const accessToken = jwt.sign(
      {
        UserInfo: {
          userId: user._id,
          verified: user.verified,
          email: user.email,
          username: user.username,
          roles: user.roles,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" } // Access token expires in 15 minutes
    );

    const refreshToken = jwt.sign(
      { username: user.username },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" } // Refresh token expires in 7 days
    );

    // Set the refresh token in a secure cookie
    res.cookie("jwt", refreshToken, {
      httpOnly: true, // Secure the cookie, can't be accessed from JavaScript
      secure: process.env.NODE_ENV === "production", // Only use secure cookies in production (over HTTPS)
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // Cross-site cookie configuration
      maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expiration matches refresh token
    });

    // Redirect the user to the dashboard after successful login
    res.redirect(`${process.env.LIVE_URL}/userdashboard`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};









// Function to read the HTML file
const readHtmlFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding: "utf-8" }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};



// @desc Verify Email using LINK
// @route GET /auth/verifyemail
// const verifyEmail = async (req, res) => {
//   const { token } = req.query;

//   try {
//     // Find the token in the database
//     const tokenDoc = await Token.findOne({ token, purpose: "email" }).exec();

//     if (!tokenDoc) {
//       console.log("Invalid or expired verification token");
//       return res
//         .status(400)
//         .json({ message: "Invalid or expired verification token" });
//     }

//     // Check if the token has expired
//     if (tokenDoc.expiresAt <= new Date()) {
//       // Token has expired
//       await tokenDoc.deleteOne(); // Remove the expired token
//       console.log("Verification token has expired");
//       return res
//         .status(400)
//         .json({ message: "Verification token has expired" });
//     }

//     // Update the user to 'verified: true'
//     const updatedUser = await User.findOneAndUpdate(
//       { email: tokenDoc.email },
//       { verified: true },
//       { new: true }
//     ).exec();

//     // Remove the token as it's no longer needed
//     await tokenDoc.deleteOne();

//     // Read the HTML file
//     const htmlFilePath = path.join(__dirname, "../views/VerifiedEmail.html");
//     const htmlContent = await readHtmlFile(htmlFilePath);

//     // Replace placeholders in the HTML content
//     const finalHtml = htmlContent.replace("{USER_EMAIL}", updatedUser.email);

//     // Send the HTML file as a response
//     res.send(finalHtml);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal Server Error", success: false });
//   }
// };


const verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    // Find the token in the database
    const tokenDoc = await Token.findOne({ token, purpose: "email" }).exec();
 console.log(tokenDoc,"trying to get email");
    if (!tokenDoc) {
      console.log("Invalid or expired verification token");
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    // Check if the token has expired
    if (tokenDoc.expiresAt < new Date()) {
      await tokenDoc.deleteOne(); // Remove the expired token
      console.log("Verification token has expired");
      return res.status(400).json({ message: "Verification token has expired" });
    }

    // Update the user to 'verified: true'
    const updatedUser = await User.findOneAndUpdate(
      { email: tokenDoc.email },
      { verified: true },
      { new: true }
    ).exec();
    console.log("User found before update:", updatedUser);
    if (!updatedUser) {
      console.log("User update failed or user not found");
      return res.status(400).json({ message: "User update failed" });
    }
    // Remove the token as it's no longer needed
    await tokenDoc.deleteOne();

    // Read the HTML file
    const htmlFilePath = path.resolve(__dirname, "../views/VerifiedEmail.html");
    const htmlContent = await readHtmlFile(htmlFilePath);

    // Replace placeholders in the HTML content
    const finalHtml = htmlContent.replace("{USER_EMAIL}", updatedUser.email);

    // Send the HTML file as a response
    res.send(finalHtml);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

// @desc Verify Email using OTP
// @route POST /auth/verifyotp
const VerifyOTP = async (req, res) => {
  const { email, OTP } = req.body;

  try {
    // Find the token associated with the user's email and purpose
    const token = await Token.findOne({ email, purpose: "email" }).exec();

    if (!token) {
      // Token not found
      console.log("Token not found");
      return res
        .status(404)
        .json({ message: "Token not found", success: false });
    }

    // Check if the user is already verified
    const user = await User.findOne({ email, verified: true }).exec();
    if (user) {
      console.log("User is already verified");
      return res
        .status(200)
        .json({ message: "User is already verified", success: true, user });
    }

    // Check if the token has expired
    if (token.expiresAt <= new Date()) {
      // Token has expired
      await token.deleteOne(); // Remove the expired token
      console.log("Token has expired");
      return res
        .status(401)
        .json({ message: "Token has expired", success: false });
    }

    // Check if the provided OTP matches the token's OTP
    if (token.token !== OTP) {
      // Incorrect OTP
      console.log("Incorrect OTP");
      return res.status(401).json({ message: "Incorrect OTP", success: false });
    }

    // Update the user to 'verified: true'
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { verified: true },
      { new: true }
    ).exec();

    // Remove the token as it's no longer needed
    await token.deleteOne();

    // Respond with success message and updated user
    console.log(`Email ${email} has been verified`);
    return res.status(200).json({
      message: "Email verification successful",
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

// @desc Create New Email Verification Link
// @route POST /auth/createnewlink
const createNewLink = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if there is an existing token with the user's email
    const existingToken = await Token.findOne({ email }).exec();

    if (existingToken) {
      // Update the existing token with a new OTP
      const newOTP = generateRandomToken();
      existingToken.token = newOTP;
      await existingToken.save();
      await sendVerificationEmail(existingToken.email, newOTP);
      console.log(existingToken);
      return res.status(200).json({ message: "Link updated successfully" });
    } else {
      // Create a new OTP
      const newOTP = generateRandomToken();

      // Create a new token with the userId and the new OTP
      const newToken = await Token.create({
        email: email,
        token: newOTP,
        purpose: "email",
      });

      // Send OTP email to the user
      await sendVerificationEmail(email, newOTP);
      console.log(newToken);
      return res
        .status(200)
        .json({ message: "New Email Verification Link created successfully" });
    }
  } catch (error) {
    console.error("Error creating new OTP:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc Create New OTP
// @route POST /auth/createnewotp
const createNewOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if there is an existing token with the user's email
    const existingToken = await Token.findOne({ email }).exec();

    if (existingToken) {
      // Update the existing token with a new OTP
      const newOTP = generateRandomToken();
      existingToken.token = newOTP;
      await existingToken.save();
      await sendOTPEmail(existingToken.email, newOTP);
      console.log(existingToken);
      return res
        .status(200)
        .json({ message: "OTP updated successfully", newOTP });
    } else {
      // Create a new OTP
      const newOTP = generateRandomToken();

      // Create a new token with the userId and the new OTP
      const newToken = await Token.create({
        email: email,
        token: newOTP,
        purpose: "email",
      });

      // Send OTP email to the user
      await sendOTPEmail(email, newOTP);
      console.log(newToken);
      return res
        .status(200)
        .json({ message: "New OTP created successfully", newOTP });
    }
  } catch (error) {
    console.error("Error creating new OTP:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc Send OTP for password reset
// @route POST /auth/forgotpassword/sendotp
// @access Public
const sendForgotPasswordOTP = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email }).exec();

    if (!user || !user.active) {
      console.log(`User not found with ${email} email`);
      return res.status(401).json({ error: "User not found", success: false });
    }

    // Check if there is an existing token with the user's email and purpose 'forgotpassword'
    const existingToken = await Token.findOne({
      email,
      purpose: "forgotpassword",
    }).exec();

    if (existingToken) {
      // Update the existing token with a new OTP
      const newOTP = generateRandomToken();
      existingToken.token = newOTP;
      await existingToken.save();
      await sendOTPEmail(existingToken.email, newOTP);
      console.log(existingToken);
      return res
        .status(200)
        .json({ message: "OTP updated successfully", success: true });
    } else {
      // Create a new OTP
      const newOTP = generateRandomToken();

      // Create a new token with the email, the new OTP, and purpose 'forgotpassword'
      const newToken = await Token.create({
        email: email,
        token: newOTP,
        purpose: "forgotpassword",
      });

      // Send OTP email to the user
      await sendOTPEmail(email, newOTP);
      console.log(newToken);
      return res
        .status(200)
        .json({ message: "OTP sent successfully", success: true });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    console.error(error.stack); // Log the stack trace
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false });
  }
};

// @desc Verify OTP for password reset
// @route POST /auth/forgotpassword/verifyotp
// @access Public
const verifyForgotPasswordOTP = async (req, res) => {
  const { email, OTP } = req.body;

  try {
    // Find the token associated with the user's email and purpose 'forgotpassword'
    const token = await Token.findOne({
      email,
      purpose: "forgotpassword",
    }).exec();

    if (!token) {
      // Token not found
      console.log("Token not found");
      return res
        .status(404)
        .json({ message: "Token not found", success: false });
    }

    // Check if the token has expired
    if (token.expiresAt <= new Date()) {
      // Token has expired
      await token.deleteOne(); // Remove the expired token
      console.log("Token has expired");
      return res
        .status(401)
        .json({ message: "Token has expired", success: false });
    }

    // Check if the provided OTP matches the token's OTP
    if (token.token !== OTP) {
      // Incorrect OTP
      console.log("Incorrect OTP");
      return res.status(401).json({ message: "Incorrect OTP", success: false });
    }

    // Respond with success message
    console.log(`OTP for password reset verified`);
    res
      .status(200)
      .json({ message: "OTP verification successful", success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

// @desc Reset password
// @route POST /auth/forgotpassword/reset
// @access Public
const resetPassword = async (req, res) => {
  const { email, OTP, password } = req.body;

  try {
    // Find the token associated with the user's email and purpose 'forgotpassword'
    const token = await Token.findOne({
      email,
      purpose: "forgotpassword",
    }).exec();

    if (!token) {
      // Token not found
      console.log("Token not found");
      return res
        .status(404)
        .json({ message: "Token not found", success: false });
    }

    // Check if the token has expired
    if (token.expiresAt <= new Date()) {
      // Token has expired
      await token.deleteOne(); // Remove the expired token
      console.log("Token has expired");
      return res
        .status(401)
        .json({ message: "Token has expired", success: false });
    }

    // Check if the provided OTP matches the token's OTP
    if (token.token !== OTP) {
      // Incorrect OTP
      console.log("Incorrect OTP");
      return res.status(401).json({ message: "Incorrect OTP", success: false });
    }

    // Update the user's password
    const hashedPassword = await hashPassword(password);
    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    ).exec();

    // Remove the token as it's no longer needed
    await token.deleteOne();

    // Respond with success message
    console.log(`Password reset successful`);
    res
      .status(200)
      .json({ message: "Password reset successful", success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const foundUser = await User.findOne({
        username: decoded.username,
      }).exec();

      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

      const accessToken = jwt.sign(
        {
          UserInfo: {
            username: foundUser.username,
            roles: foundUser.roles,
            verified: foundUser.verified,
            email: foundUser.email,
            userId: foundUser._id,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      res.json({ accessToken });
    }
  );
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.json({ message: "Cookie cleared" });
};

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = async (req, res) => {
  const { id, username, roles, active, password } = req.body;

  // Confirm data
  if (!id || !username || !Array.isArray(roles) || !roles.length) {
    return res
      .status(400)
      .json({ message: "All fields except password are required" });
  }

  // Does the user exist to update?
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  // Check for duplicate
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  // Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  user.username = username;
  user.roles = roles;
  user.active = active;

  if (password) {
    // Hash password
    user.password = await bcrypt.hash(password, 10); // salt rounds
  }

  const updatedUser = await user.save();

  res.json({ message: updatedUser.username + " " + "updated" });
};

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "User ID Required" });
  }

  // Does the user exist to delete?
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const result = await user.deleteOne();

  const reply = `Username ${result.username} with ID ${result._id} deleted`;

  res.json(reply);
};

module.exports = {
  login,
  verifyEmail,
  GoogleCallback,
  GoogleHandler,
  refresh,
  createNewOTP,
  VerifyOTP,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
  createNewLink,
  register,
  logout,
  updateUser,
  deleteUser,
};

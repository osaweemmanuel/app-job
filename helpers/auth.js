const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const sendOTPEmail = async (email, token) => {
  try {
    let transporter = nodemailer.createTransport({
      pool: true,
      host:process.env.EMAIL_HOST,

      port: 587,
      secure: false,
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.APP_PASSWORD,
      },
      tls: {
        ciphers: "SSLv3", // Ensure correct SSL/TLS compatibility
        minVersion: "TLSv1.2", // Force TLS 1.2+
        rejectUnauthorized: false // (Optional) Bypass SSL verification issues
      },
    });

    const htmlTemplate = `
        <html>
        <body style="text-align: center; max-width:100%; font-family: Arial, sans-serif;">
    
            <h1 style="color: #333;">X3 StaffingInc</h1>
    
            <p>Your one-time Email verification code is:</p>
    
            <h2 style="color: #333; font-size: 24px;">${token}</h2>
    
            <p>Copy the link and Paste it to verify the Email</p>
        </body>
    </html>    
        `;

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Verify Your Email",
      html: htmlTemplate,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log("Email sent:", result);

    return "Verification email sent successfully";
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(12, (err, salt) => {
      if (err) {
        reject(err);
      }
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
        }
        resolve(hash);
      });
    });
  });
};

const comparePassword = (password, hash) => {
  return bcrypt.compare(password, hash);
};

const generateRandomToken = () => {
  const min = 100000;
  const max = 999999;

  const randomToken = Math.floor(Math.random() * (max - min + 1)) + min;

  return randomToken.toString();
};

const sendVerificationEmail = async (email, token) => {
  try {
    const verificationLink = `${process.env.BASE_URL}/auth/verify-email?token=${token}`;

    let transporter = nodemailer.createTransport({
      pool: true,
      host: process.env.EMAIL_HOST,
      port: 587,
      secure: true,
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.APP_PASSWORD,
      },
      tls: {
        ciphers: "SSLv3", // Ensure correct SSL/TLS compatibility
        minVersion: "TLSv1.2", // Force TLS 1.2+
        rejectUnauthorized: false // (Optional) Bypass SSL verification issues
      },
    });
    const htmlTemplate = `
          <html>
          <body style="text-align: center; max-width:100%; font-family: Arial, sans-serif;">

              <h1 style="color: #333;">X3 StaffingInc</h1>

              <p>Click the link below to verify your email:</p>

              <a href="${verificationLink}" style="color: #333; font-size: 24px;">Verify Email</a>
          </body>
          </html>
      `;

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Verify Your Email",
      html: htmlTemplate,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log("Email sent:", result);

    return "Verification email sent successfully";
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendOTPEmail,
  generateRandomToken,
  hashPassword,
  comparePassword,
};

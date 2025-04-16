// File: src/config/allConfig.js
const cors = require("cors");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const User = require("../models/user.model");

class Config {
  getCorsConfig() {
    return {
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL
          : "http://localhost:3000",
    };
  }
  getCookieConfig() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // to prevent CSRF attacks
      maxAge: 5 * 60 * 60 * 1000, // 5 hours in milliseconds
    };
  }
  getPassportConfig() {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
          const isEmailVerified = profile.emails[0].verified;
          if (!isEmailVerified) done(new Error("email not verified!", null));
          const userInfo = {
            fullName: profile.name?.givenName + " " + profile.name?.familyName,
            email: profile.emails[0].value,
            profilePicture: profile.photos[0].value,
            googleId: profile.id,
          };
          const existingUser = await User.findOne({ googleId: profile.id });
          if (existingUser) {
            return done(null, existingUser); // User already exists
          }
          // create new user
          const newUser = new User(userInfo);
          newUser.save();
          done(null, newUser); // Pass user object to next middleware
        }
      )
    );
  }
  getResetPasswordMessage(mailto, resetUrl) {
    return {
      mailto: mailto,
      subject: "Reset Password",
      html: `
        <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; color: #333;">
          <h2 style="text-align: center; color: #007BFF;">Password Reset Request</h2>
          <p>Hi there,</p>
          <p>You recently requested to reset your password. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007BFF; color: white; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
              Reset Your Password
            </a>
          </div>
          <p>If you did not request this, please ignore this email.</p>
          <p>Thanks,<br>Job Portal Team</p>
          <hr>
          <p style="font-size: 12px; color: #999; text-align: center;">
            If the button above doesn’t work, copy and paste the following URL into your browser:
            <br>
            <a href="${resetUrl}" style="color: #007BFF;">${resetUrl}</a>
          </p>
        </div>
      `,
    };
  }
  getSocketConfig() {
    return {
      cors: {
        origin:
          process.env.NODE_ENV === "production"
            ? process.env.FRONTEND_URL
            : "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
      },
    };
  }
}

module.exports = new Config();

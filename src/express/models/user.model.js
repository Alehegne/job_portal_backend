const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = new mongoose.Schema(
  {
    //basic info
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    //TODO: add update email and password,role,phone settings
    password: {
      type: String,
      //not required for google logIn
    },
    role: {
      type: String,
      enum: ["jobSeeker", "employer", "admin"],
      default: "jobSeeker",
    },
    profilePicture: {
      type: String,
      default: "default.jpg",
    },
    phone: {
      type: String,
      unique: true,
      sparse: true, //used for optional fields, it allows multiple null values. it will not create a unique index for null values.
    },
    location: {
      //user location
      type: String,
      trim: true,
    },
    preferredLocation: {
      //use to recommend jobs to the user based on location
      type: String,
      trim: true,
    },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship"],
      default: "full-time",
    },
    about: {
      type: String,
      trim: true,
    },
    socialLinks: {
      linkedIn: {
        type: String,
      },
      github: {
        type: String,
      },
      twitter: {
        type: String,
      },
      facebook: {
        type: String,
      },
    },

    //for jobSeeker
    resumeUrl: {
      type: String,
    },
    skills: {
      type: [String],
      default: [],
    },
    experiance: [
      {
        company: String,
        position: String,
        startDate: Date,
        endDate: {
          type: Date,
          default: null,
        },
        description: String,
      },
    ],
    //for job-seeker,
    experianceLevel: {
      type: String,
      enum: ["junior", "mid-level", "senior"],
    },
    education: [
      {
        institution: String,
        degree: String,
        fieldOfStudy: String,
        startDate: Date,
        endDate: Date,
        grade: String,
        description: String,
      },
    ],

    //employer fields
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    //common fields for jobSeeker and employer
    appliedJobs: [
      //one to many relationship
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
      },
    ],
    postedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    //for reset password
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordTokenExpiry: {
      type: Date,
      default: null,
    },
    //for google logIn
    googleId: {
      type: String,
    },
  },
  {
    timestamps: true, //createdAt and updatedAt fields will be created automatically, and it updates the updatedAt field automatically when the document is updated
  }
);

//hash before saving(pre-save)

User.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

//generate password reset token

User.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  // console.log("reset token in user model", resetToken);
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex"); // hashing the token to store in the database
  // console.log("hashed reset token in user model", this.resetPasswordToken);
  this.resetPasswordTokenExpiry = Date.now() + 30 * 60 * 1000; //30 minutes expiry time
  return resetToken; //returning the plain token to send to the user
};

module.exports = mongoose.model("User", User);
//this will create a collection named users in the database, and it will use the User schema to create the documents in the collection

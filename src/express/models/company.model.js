const { default: mongoose, Mongoose } = require("mongoose");

const Company = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    logoUrl: {
      type: String,
      validate: {
        validator: function (v) {
          return /^(https?:\/\/)?([\w\d\-]+\.)+\w{2,}(\/.*)?$/.test(v);
        },
        message: (props) => `${props.value} is not a valid URL!`,
      },
    },
    websiteUrl: {
      type: String,
      validate: {
        validator: function (v) {
          return /^(https?:\/\/)?([\w\d\-]+\.)+\w{2,}(\/.*)?$/.test(v);
        },
        message: (props) => `${props.value} is not a valid URL!`,
      },
    },
    email: {
      type: String,
      validate: {
        validator: function (v) {
          return /^\S+@\S+\.\S+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    phone: {
      type: String,
      validate: {
        validator: function (v) {
          return /^\+?[1-9]\d{1,14}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },

    type: {
      type: String,
      enum: ["company", "startup", "enterprise"],
      default: "startup",
    },
    ownerShip: {
      type: String,
      enum: ["proprietorship", "partnership", "corporation"],
      default: "proprietorship",
    },

    industry: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    tags: [String], //to store tags line tech,finance, etc
    description: String,
    createdBy: [
      //a company can be created by multiple users, the creators
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    jobPosted: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],
    foundedYear: {
      type: Number,
    },
    isActive: {
      //usefull for soft delete
      type: Boolean,
      default: true,
    },
    size: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "small",
    },
    isVerified: {
      type: String,
      enum: ["pending", "verified", "not verified"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Company", Company);

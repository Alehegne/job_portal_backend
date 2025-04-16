const mongoose = require("mongoose");

const Job = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  experianceLevel: {
    type: String,
    enum: ["junior", "mid-level", "senior"],
  },
  company: String,
  description: String,
  salary: {
    type: [String, Number],
  },
  location: String,
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  jobType: {
    type: String,
    enum: ["full-time", "part-time", "contract", "internship"],
  },
  applicants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  skills: {
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model("Job", Job);

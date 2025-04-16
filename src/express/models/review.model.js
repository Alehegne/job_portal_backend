const { default: mongoose } = require("mongoose");

const Review = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Company",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    reviewText: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Review", Review);

//represents the messages between users(employers and job seekers)

const { default: mongoose } = require("mongoose");

const Message = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now(),
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Message", Message);

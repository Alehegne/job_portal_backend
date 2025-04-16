const express = require("express");
const MessageController = require("../controllers/message.controller");
const middleware = require("../middleware/allMiddleware");
const multer = require("multer");
const MessageRouter = express.Router();
const upload = multer();
// console.log("MessageRouter initialized:-");
//send messages to the receiver
MessageRouter.post(
  "/",
  middleware.verifyToken,
  upload.none(),
  MessageController.createMessage
);
//get all send and received messages by the user
MessageRouter.get("/get", middleware.verifyToken, MessageController.messages);

module.exports = MessageRouter;

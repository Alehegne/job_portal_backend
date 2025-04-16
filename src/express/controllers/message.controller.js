const BaseController = require("./Base.Controller");
const MessageService = require("../services/main/message.services");
const UserService = require("../services/main/user.services");

class MessageController extends BaseController {
  constructor() {
    super();
    Object.getOwnPropertyNames(MessageController.prototype).forEach(
      (method) => {
        if (method !== "constructor" && typeof this[method] === "function")
          this[method] = this[method].bind(this);
      }
    );
  }

  //create message
  async createMessage(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const body = req.body;
      const senderId = req.user.id;
      const messageData = {
        ...body,
        sender: senderId,
      };
      const valid = await MessageService.validateMessageData(messageData);
      if (!valid.success) return this.errorMessage(valid.error, 400, next);
      //check if sender and receiver are same
      if (messageData.sender === messageData.receiver) {
        return this.errorMessage(
          res,
          400,
          "Sender and receiver cannot be same"
        );
      }
      //check if receiver exists
      const receiver = await UserService.findById(messageData.receiver);
      if (!receiver) {
        return this.errorMessage(res, 404, "Receiver not found");
      }

      //create message

      const message = await MessageService.create(messageData);
      if (!message)
        return this.errorMessage(res, 400, "Failed to create message");
      return this.successResponse(res, {
        message: "Message created successfully",

        data: message,
      });
    });
  }
  async messages(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const receiverId = req.user.id;
      const page = req.query.page || 1;
      const limit = req.query.limit || 10;
      const skip = (page - 1) * limit;

      //get messages by receiver id
      const response = await MessageService.getMessages(receiverId, {
        skip: skip,
        limit: limit,
        page: page,
      });
      if (!response.messages || response.messages.length === 0)
        return this.errorMessage("No messages found", 404, next);
      //filter out unnecessary data from messages
      return this.successResponse(res, {
        message: "Messages retrieved successfully",
        data: response.messages,
        analytics: response.analysis,
      });
    });
  }
}

module.exports = new MessageController();

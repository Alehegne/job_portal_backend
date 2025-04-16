const BaseRepository = require("./BaseRepositoryService");
const Message = require("../../models/message.model");
const Joi = require("joi");

class MessageService extends BaseRepository {
  constructor() {
    super(Message);
  }
  async validateMessageData(messageData) {
    const schema = Joi.object({
      sender: Joi.string().required(),
      receiver: Joi.string().required(),
      message: Joi.string().required(),
    });
    const { error } = schema.validate(messageData);
    if (error) {
      return { success: false, error: error.details.map((e) => e.message) };
    }
    return { success: true };
  }
  async getMessages(receiverId, options) {
    const messages = await Message.find({
      $or: [{ sender: receiverId }, { receiver: receiverId }], //this is to get all messages sent and received by the user
    })
      .populate("sender", "fullName email phone role profilePicture")
      .populate("receiver", "fullName email phone role profilePicture")
      .sort({ sentAt: -1 })
      .skip(options.skip)
      .limit(options.limit)
      .exec();

    const totalMessages = await Message.countDocuments({
      receiver: receiverId,
    });

    const totalPages = Math.ceil(totalMessages / options.limit);
    const analysis = {
      totalPages: totalPages,
      currentPage: options.page,
      totalMessages: totalMessages,
      hasNextPage: options.page < totalPages,
      hasPreviousPage: options.page > 1,
      nextPage: options.page < totalPages ? options.page + 1 : null,
      previousPage: options.page > 1 ? options.page - 1 : null,
    };

    return {
      messages: messages,
      analysis: analysis,
    };
  }
}

module.exports = new MessageService();

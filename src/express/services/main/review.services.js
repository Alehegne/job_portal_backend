const BaseRepository = require("./BaseRepositoryService");
const Review = require("../../models/review.model");
const Joi = require("joi");

class ReviewServices extends BaseRepository {
  constructor() {
    super(Review);
  }

  async validateReview(reviewData) {
    const { companyId, userId, rating, reviewText } = reviewData;

    const reviewSchema = Joi.object({
      companyId: Joi.string().required(),
      userId: Joi.string().required(),
      rating: Joi.number().min(1).max(5).required(),
      reviewText: Joi.string().optional(),
    });

    const { error } = reviewSchema.validate(reviewData);
    if (error) {
      return {
        success: false,
        message: `validation failed`,
        error: error.details.map((error) => error.message),
      };
    }
    return {
      success: true,
      message: "validation success",
    };

    return true;
  }
}

module.exports = new ReviewServices();

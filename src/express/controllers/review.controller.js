const BaseController = require("./Base.Controller");
const ReviewServices = require("../services/main/review.services");

class ReviewController extends BaseController {
  constructor() {
    super();

    Object.getOwnPropertyNames(ReviewController.prototype).forEach((method) => {
      if (method !== "constructor" && typeof this[method] === "function")
        this[method] = this[method].bind(this);
    });
  }

  async createReview(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const { companyId, rating, reviewText } = req.body;
      const userId = req.user.id;
      const reviewData = {
        userId: userId,
        companyId: companyId,
        rating: rating,
        reviewText: reviewText,
      };
      // Validate the review data
      const valid = await ReviewServices.validateReview(reviewData);
      if (!valid.success) return this.errorMessage(valid.error, 400, next);
      // Check if the review already exists
      const existingReview = await ReviewServices.findOne({
        userId: userId,
        companyId: companyId,
      });
      if (existingReview)
        return this.errorMessage("Review already exists", 400, next);
      const review = await ReviewServices.create(reviewData);
      if (!review)
        return this.errorMessage("Unable to create review", 400, next);
      return this.successResponse(
        res,
        { message: "Review created successfully", data: review },
        201
      );
    });
  }
  async getCompanyReviews(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const { id } = req.params;

      //get reviews for a specific company
      const reviews = await ReviewServices.findWithQuery({ companyId: id });
      if (!reviews || reviews.length === 0)
        return this.errorMessage("Unable to get reviews", 400, next);
      return this.successResponse(
        res,
        { message: "Reviews retrieved successfully", data: reviews },
        200
      );
    });
  }
  async getUserReviews(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const { id } = req.params;
      //get reviews for a specific user
      const reviews = await ReviewServices.findWithQuery({ userId: id });
      if (!reviews || reviews.length === 0)
        return this.errorMessage("Unable to get reviews", 400, next);
      return this.successResponse(
        res,
        { message: "Reviews retrieved successfully", data: reviews },
        200
      );
    });
  }
  async updateReview(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const { id } = req.params;
      const updateReview = req.body;
      const userId = req.user.id;
      // Check if the review exists
      const existingReview = await ReviewServices.findOne({ _id: id });
      if (!existingReview)
        return this.errorMessage("Review not found", 404, next);

      // Check if the review belongs to the user
      if (
        existingReview.userId.toString() !== userId.toString() &&
        req.user.role !== "admin"
      )
        return this.errorMessage(
          "You are not authorized to update this review",
          403,
          next
        );

      // update the review
      const updatedReview = await ReviewServices.update(id, updateReview);
      if (!updatedReview)
        return this.errorMessage("Unable to update review", 400, next);

      return this.successResponse(res, {
        message: "Review updated successfully",
        data: updatedReview,
      });
    });
  }
  async deleteReview(req, res, next) {
    return this.handleRequest(req, res, next, async (req, res) => {
      const { id } = req.params;
      const userId = req.user.id;
      // Check if the review exists
      const existingReview = await ReviewServices.findOne({ _id: id });
      if (!existingReview)
        return this.errorMessage("Review not found", 404, next);

      // Check if the review belongs to the user
      const isCreatedByUser =
        existingReview.userId.toString() === userId.toString();
      if (!isCreatedByUser && req.user.role !== "admin")
        return this.errorMessage(
          "You are not authorized to delete this review",
          403,
          next
        );

      return this.successResponse(res, {
        message: "Review deleted successfully",
        data: existingReview,
      });
    });
  }
}

module.exports = new ReviewController();

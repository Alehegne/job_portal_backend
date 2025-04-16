const express = require("express");
const ReviewController = require("../controllers/review.controller");
const middleware = require("../middleware/allMiddleware");
const multer = require("multer");

const ReviewRouter = new express.Router();
const upload = multer();
// console.log("ReviewRouter initialized:-");
// Create a new review
ReviewRouter.post(
  "/",
  middleware.verifyToken,
  upload.none(),
  ReviewController.createReview
);

//get company reviews, for a specific company itself
ReviewRouter.get(
  "/:id",
  middleware.verifyToken,
  middleware.validateObjectId,

  ReviewController.getCompanyReviews
);

//get all reviews for a specific user
ReviewRouter.get(
  "/user/:id",
  middleware.verifyToken,
  middleware.validateObjectId,
  ReviewController.getUserReviews
);
//update review by writer or admin
ReviewRouter.put(
  "/:id",
  middleware.verifyToken,
  middleware.validateObjectId,
  ReviewController.updateReview
);
//delete review by writer or admin

ReviewRouter.delete(
  "/:id",
  middleware.verifyToken,
  middleware.validateObjectId,
  ReviewController.deleteReview
);

module.exports = ReviewRouter;

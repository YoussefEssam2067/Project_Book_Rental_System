// routes/reviews.route.js
const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/ratingController");
const authMiddleware = require("../middlewares/authMiddleware");

// Show review form
router
  .route("/books/:id/review")
  .get(authMiddleware, ratingController.getAddReviewPage);

router
  .route("/books/:id/reviews")
  .post(authMiddleware, ratingController.addReview);

router
  .route("/reviews/:id/edit")
  .get(authMiddleware, ratingController.getEditReviewPage)
  .post(authMiddleware, ratingController.editReview);

router
  .route("/reviews/:id/delete")
  .post(authMiddleware, ratingController.deleteReview);

module.exports = router;

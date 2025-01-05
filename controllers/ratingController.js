const asyncWrapper = require("../middlewares/asyncWrapper");
const { Rating, Rental, Book, User } = require("../models");

const getAddReviewPage = asyncWrapper(async (req, res) => {
  const { id: bookId } = req.params;

  try {
    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).send("Book not found.");
    }

    res.render("reviews/add", {
      title: "Add Review",
      userName: req.session.userName,
      book,
      error: null, // Ensure this is passed
      success: null, // Ensure this is passed
    });
  } catch (err) {
    res.status(500).send("Error loading review page.");
  }
});

const addReview = asyncWrapper(async (req, res) => {
  const { id: bookId } = req.params;
  const { rating, review } = req.body;
  const userId = req.session.userId;

  try {
    // Check if the user has rented the book
    const rental = await Rental.findOne({
      where: { userId, bookId, status: "finished" },
    });

    if (!rental) {
      return res.status(400).send("You must finish renting this book first.");
    }

    // Create the review
    await Rating.create({ userId, bookId, rating, review });

    res.redirect(`/books/${bookId}`);
    res.redirect("/rentals");
  } catch (err) {
    res.status(500).send("Error submitting review.");
  }
});

const getEditReviewPage = asyncWrapper(async (req, res) => {
  const reviewId = req.params.id;
  const review = await Rating.findByPk(reviewId, {
    include: [{ model: User, attributes: ["id", "name"] }, { model: Book }],
  });

  // Ensure the review exists
  if (!review) {
    return res.status(404).send("Review not found");
  }

  // Check if the logged-in user is the owner of the review
  if (review.userId !== req.session.userId) {
    return res.status(403).send("You are not authorized to edit this review");
  }

  // Fetch the related book to display on the edit page
  const book = await Book.findByPk(review.bookId);

  res.render("reviews/edit", {
    title: "Edit Review",
    review,
    book,
    userName: req.session.userName,
  });
});

const editReview = asyncWrapper(async (req, res) => {
  const reviewId = req.params.id;
  const { review, rating } = req.body;

  // Find the review and ensure it belongs to the user
  const existingReview = await Rating.findByPk(reviewId);
  if (!existingReview) {
    return res.status(404).send("Review not found");
  }

  if (existingReview.userId !== req.session.userId) {
    return res.status(403).send("You are not authorized to edit this review");
  }

  // Update the review
  existingReview.review = review;
  existingReview.rating = rating;
  await existingReview.save();

  res.redirect(`/books/${existingReview.bookId}`);
});

const deleteReview = asyncWrapper(async (req, res) => {
  const reviewId = req.params.id;

  // Find the review and ensure it belongs to the user
  const review = await Rating.findByPk(reviewId);
  if (!review) {
    return res.status(404).send("Review not found");
  }

  if (review.userId !== req.session.userId) {
    return res.status(403).send("You are not authorized to delete this review");
  }

  // Delete the review
  await review.destroy();

  res.redirect(`/books/${review.bookId}`);
});

module.exports = {
  getAddReviewPage,
  addReview,
  getEditReviewPage,
  editReview,
  deleteReview,
};

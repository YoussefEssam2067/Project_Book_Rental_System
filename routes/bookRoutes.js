const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");
const authMiddleware = require("../middlewares/authMiddleware");

const upload = require("../middlewares/uploadBookMiddleware");

router.route("/books").get(authMiddleware, bookController.getAllBooks);

router
  .route("/books/new")
  .get(authMiddleware, bookController.getAddNewBookPage)
  .post(
    authMiddleware,
    upload.fields([
      { name: "thumbnail", maxCount: 1 },
      { name: "url", maxCount: 10 },
      { name: "pdf", maxCount: 1 },
    ]),
    bookController.createBook
  );

router.route("/books/:id").get(authMiddleware, bookController.getBook);

router
  .route("/books/:id/delete")
  .post(authMiddleware, bookController.deleteBook);

router
  .route("/books/:id/edit")
  .get(authMiddleware, bookController.getEditBookPage);

router.route("/books/:id/edit-book").post(
  authMiddleware,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "url", maxCount: 10 },
    { name: "pdf", maxCount: 1 },
  ]),
  bookController.updateBook
);

module.exports = router;

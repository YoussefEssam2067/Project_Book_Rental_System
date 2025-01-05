const express = require("express");
const router = express.Router();
const rentalController = require("../controllers/rentalController");
const authMiddleware = require("../middlewares/authMiddleware");

router
  .route("/books/:id/rent")
  .get(authMiddleware, rentalController.getRentPage)
  .post(authMiddleware, rentalController.rentBook);

router.route("/rentals").get(authMiddleware, rentalController.getUserRentals);

router
  .route("/rentals/api")
  .get(authMiddleware, rentalController.getUserRentalsAPI);

router
  .route("/rentals/pdfViewer")
  .get(authMiddleware, rentalController.pdfViewer);

router
  .route("/rentals/:id/edit")
  .get(authMiddleware, rentalController.getEditRentPage)
  .post(authMiddleware, rentalController.editRental);

router
  .route("/rentals/:id/delete")
  .post(authMiddleware, rentalController.deleteRental);

module.exports = router;

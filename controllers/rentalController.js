const asyncWrapper = require("../middlewares/asyncWrapper");
const { Book, BookImage, Rental } = require("../models");
const { Op } = require("sequelize");

const getRentPage = asyncWrapper(async (req, res) => {
  const book = await Book.findByPk(req.params.id);

  if (!book) return res.status(404).send("Book not found");

  res.render("rental/rent", {
    title: "Rent Book",
    userName: req.session.userName,
    book,
  });
});

const rentBook = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = req.body;
  const bookId = req.params.id;
  const userId = req.session.userId;

  // Fetch the book
  const book = await Book.findByPk(bookId);
  if (!book) {
    return res.status(404).send("Book not found.");
  }

  // Validate dates
  if (
    new Date(startDate) < new Date() ||
    new Date(endDate) <= new Date(startDate)
  ) {
    return res.render("rental/rent", {
      title: "Rent Book",
      userName: req.session.userName,
      book,
      error: "Invalid dates. Please choose appropriate start and end dates.",
    });
  }

  // Check for overlapping rentals by any user
  const overlappingRental = await Rental.findOne({
    where: {
      bookId,
      status: "rented",
      [Op.or]: [
        { startDate: { [Op.between]: [startDate, endDate] } },
        { endDate: { [Op.between]: [startDate, endDate] } },
        { startDate: { [Op.lte]: startDate }, endDate: { [Op.gte]: endDate } },
      ],
    },
  });

  if (overlappingRental) {
    return res.render("rental/rent", {
      title: "Rent Book",
      userName: req.session.userName,
      book,
      error: "The selected rental period overlaps with another user.",
    });
  }

  // Check for overlapping rentals by the current user
  const userOverlappingRental = await Rental.findOne({
    where: {
      userId,
      [Op.or]: [
        { startDate: { [Op.between]: [startDate, endDate] } },
        { endDate: { [Op.between]: [startDate, endDate] } },
        { startDate: { [Op.lte]: startDate }, endDate: { [Op.gte]: endDate } },
      ],
    },
  });

  if (userOverlappingRental) {
    return res.render("rental/rent", {
      title: "Rent Book",
      userName: req.session.userName,
      book,
      error: "You already have an overlapping rental period for another book.",
    });
  }

  // Create rental if no overlap exists
  await Rental.create({
    userId,
    bookId,
    startDate,
    endDate,
    status: "rented",
  });

  res.redirect("/rentals");
});

const getUserRentals = asyncWrapper(async (req, res) => {
  // Find rentals that have not ended
  const rentals = await Rental.findAll({
    where: { userId: req.session.userId },
    include: [{ model: Book, attributes: ["title", "thumbnail", "pdf", "id"] }],
  });

  // Iterate through the rentals and update the status if the rental has started or ended
  await Promise.all(
    rentals.map(async (rental) => {
      const currentDate = new Date();

      // Check if the rental has started but not yet ended
      if (
        new Date(rental.startDate) <= currentDate &&
        new Date(rental.endDate) > currentDate &&
        rental.status !== "started"
      ) {
        // If the rental is active, set status to 'started'
        rental.status = "started";
        await rental.save();
      }

      // Check if the rental has ended
      if (
        new Date(rental.endDate) < currentDate &&
        rental.status !== "finished"
      ) {
        // If the rental has ended, set status to 'finished'
        rental.status = "finished";
        await rental.save();
      }
    })
  );

  // Group rentals by bookId
  const groupedRentals = rentals.reduce((acc, rental) => {
    const bookId = rental.bookId;
    if (!acc[bookId]) {
      acc[bookId] = {
        book: rental.Book,
        rentals: [],
      };
    }
    acc[bookId].rentals.push(rental);
    return acc;
  }, {});

  res.render("rental/list", {
    title: "My Rentals",
    userName: req.session.userName,
    groupedRentals,
  });
});

const getUserRentalsAPI = asyncWrapper(async (req, res) => {
  const currentDate = new Date();

  // Find rentals that have not ended
  const rentals = await Rental.findAll({
    where: { userId: req.session.userId },
    include: [{ model: Book, attributes: ["title", "thumbnail", "pdf", "id"] }],
  });

  // Iterate through the rentals and update the status if the rental has ended
  await Promise.all(
    rentals.map(async (rental) => {
      if (
        new Date(rental.endDate) < currentDate &&
        rental.status !== "finished"
      ) {
        // If the rental has ended and the status is not already 'finished', update it
        rental.status = "finished";
        await rental.save();
      }
    })
  );

  // Group rentals by bookId
  const groupedRentals = rentals.reduce((acc, rental) => {
    const bookId = rental.bookId;
    if (!acc[bookId]) {
      acc[bookId] = {
        book: rental.Book,
        rentals: [],
      };
    }
    acc[bookId].rentals.push(rental);
    return acc;
  }, {});

  res.json(groupedRentals);
});

const pdfViewer = asyncWrapper(async (req, res) => {
  // You can pass the PDF file path dynamically if you want
  const pdfUrl = `/uploads/books/files/${req.query.pdf}`; // Path to your PDF file
  const endDate = req.query.endDate;
  res.render("rental/pdfViewer", {
    title: "pdf Viewer",
    userName: req.session.userName,
    pdfUrl,
    endDate,
  });
});

// Render Edit Rental Page
const getEditRentPage = async (req, res) => {
  try {
    const rentalId = req.params.id;
    const rental = await Rental.findByPk(rentalId, {
      include: { model: Book, attributes: ["title", "thumbnail"] },
    });

    if (!rental) {
      return res.status(404).send("Rental not found.");
    }

    res.render("rental/edit-rent", {
      title: "Edit Rental",
      rental,
      book: rental.Book,
      userName: req.session.userName,
      error: "",
    });
  } catch (error) {
    res.status(500).send("Error loading rental edit page.");
  }
};

// Update Rental
const editRental = async (req, res) => {
  try {
    const rentalId = req.params.id;
    const { startDate, endDate } = req.body;

    const rental = await Rental.findByPk(rentalId);
    if (!rental) {
      return res.status(404).send("Rental not found.");
    }

    // Validate dates
    if (
      new Date(startDate) < new Date() ||
      new Date(endDate) <= new Date(startDate)
    ) {
      return res.render("rental/edit", {
        title: "Edit Rental",
        rental,
        error: "Invalid dates. Please choose appropriate start and end dates.",
      });
    }

    // Check for overlapping rentals
    const overlappingRental = await Rental.findOne({
      where: {
        bookId: rental.bookId,
        id: { [Op.ne]: rentalId }, // Exclude current rental
        status: "rented",
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } },
          {
            startDate: { [Op.lte]: startDate },
            endDate: { [Op.gte]: endDate },
          },
        ],
      },
    });

    if (overlappingRental) {
      return res.render("rental/edit", {
        title: "Edit Rental",
        rental,
        error: "The selected rental period overlaps with another rental.",
      });
    }

    // Update rental
    rental.startDate = startDate;
    rental.endDate = endDate;
    await rental.save();

    res.redirect("/rentals"); // Redirect to rentals list
  } catch (error) {
    res.status(500).send("Error updating rental.");
  }
};

// Delete Rental
const deleteRental = async (req, res) => {
  try {
    const rentalId = req.params.id;
    const rental = await Rental.findByPk(rentalId);

    if (!rental) {
      return res.status(404).send("Rental not found.");
    }

    await rental.destroy(); // Delete rental
    res.redirect("/rentals"); // Redirect to rentals list
  } catch (error) {
    res.status(500).send("Error deleting rental.");
  }
};

module.exports = {
  getRentPage,
  rentBook,
  getUserRentals,
  getUserRentalsAPI,
  pdfViewer,
  getEditRentPage,
  editRental,
  deleteRental,
};

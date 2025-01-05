const asyncWrapper = require("../middlewares/asyncWrapper");
const { User, Book, BookImage, Rental, Rating } = require("../models");
const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");
const Sequelize = require("sequelize");

const getAllBooks = asyncWrapper(async (req, res) => {
  const query = req.query;

  // Pagination parameters
  const limit = parseInt(query.limit) || 4;
  const page = parseInt(query.page) || 1;
  const offset = (page - 1) * limit;

  // Filter conditions
  const whereConditions = {
    userId: { [Op.ne]: req.session.userId }, // Exclude user's own books
    id: {
      [Op.notIn]: Sequelize.literal(`(
        SELECT \`bookId\` 
        FROM \`Rentals\` 
        WHERE \`userId\` = ${req.session.userId} 
        AND \`status\` IN ('rented', 'started')
      )`),
    }, // Exclude books rented by the current user
  };

  try {
    // Separate count query
    const count = await Book.count({
      where: whereConditions,
    });

    // Fetch paginated books
    const books = await Book.findAll({
      where: whereConditions,
      limit: limit,
      offset: offset,
      include: [
        { model: User, attributes: ["name"] },
        { model: BookImage, attributes: ["url"] },
      ],
    });

    const totalPages = Math.ceil(count / limit);

    // books.forEach((book) => {
    //   console.log(`Book Title: ${book.title}`);
    //   console.log(`Book Thumbnail: ${book.thumbnail}`);
    //   if (book.BookImages && book.BookImages.length > 0) {
    //     book.BookImages.forEach((image, index) => {
    //       console.log(`Image ${index + 1} URL: ${image.dataValues.url}`);
    //     });
    //   } else {
    //     console.log("No images available for this book.");
    //   }
    // });

    // Render the response
    res.render("book/index", {
      title: "Library",
      userName: req.session.userName,
      books,
      currentPage: page,
      totalPages,
      limit,
      userId: req.session.userId,
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).render("error", { message: "Failed to fetch books." });
  }
});

const getBook = asyncWrapper(async (req, res) => {
  const book = await Book.findByPk(req.params.id, {
    include: [
      {
        model: User,
        attributes: ["name"],
      },
      {
        model: BookImage,
        attributes: ["url"],
      },
      {
        model: Rating,
        include: [
          {
            model: User,
            attributes: ["id", "name"],
          },
        ],
      },
    ],
  });

  if (!book) {
    return res.status(404).send("Book not found");
  }

  // Check if the current user has rented the book and if the rental is completed
  const rental = await Rental.findOne({
    where: {
      userId: req.session.userId,
      bookId: book.id,
      status: "finished", // Only show the review section if rental is completed
    },
  });

  res.render("book/detail", {
    title: book.title,
    userName: req.session.userName,
    book,
    rental, // Pass the rental data to the view
    userId: req.session.userId,
  });
});

const getAddNewBookPage = asyncWrapper(async (req, res) => {
  res.render("book/new", {
    title: "Add new book",
    userName: req.session.userName,
    errors: "",
    formData: "",
  });
});

const createBook = asyncWrapper(async (req, res) => {
  const { title, author, description } = req.body;
  const errors = {};

  // Validation checks
  if (!title) errors.title = "Title is required";
  if (!author) errors.author = "Author is required";
  if (!description) errors.description = "Description is required";

  // Extract uploaded files
  const thumbnailFile = req.files?.thumbnail?.[0]?.filename; // Handled by uploadThumbnail.single("thumbnail")
  const imageFiles = req.files?.url?.map((file) => file.filename) || []; // Handled by uploadGallery.array("url")
  const pdfFile = req.files?.pdf?.[0]?.filename; // Handled by uploadFile.single("pdf")

  // Validate required files
  if (!thumbnailFile) errors.thumbnail = "Thumbnail is required";
  if (imageFiles.length === 0) errors.url = "Gallery images are required";
  if (!pdfFile) errors.pdf = "PDF file is required";

  // Re-render form if errors exist
  if (Object.keys(errors).length > 0) {
    return res.render("book/new", {
      title: "Add New Book",
      userName: req.session.userName,
      errors,
      formData: { title, author, description },
    });
  }

  // Construct the book object
  const bookData = {
    title,
    author,
    description,
    userId: req.session.userId,
    thumbnail: thumbnailFile, // Save thumbnail filename
    pdf: pdfFile, // Save PDF filename
  };

  // Create the book in the database
  const newBook = await Book.create(bookData);

  // Insert each image into the BookImage model
  for (const imageFile of imageFiles) {
    await BookImage.create({
      bookId: newBook.id,
      url: imageFile,
    });
  }

  // Redirect after successful creation
  res.redirect("/books");
});

const deleteBook = asyncWrapper(async (req, res) => {
  const book = await Book.findByPk(req.params.id, {
    include: [
      {
        model: BookImage, // Include the BookImage model
        attributes: ["url"], // Specify attributes to fetch
      },
    ],
  });

  if (!book) {
    return res.status(404).send("Book not found");
  }

  // Delete the thumbnail file
  const oldThumbnail = book.thumbnail;
  const thumbnailPath = path.join(
    __dirname,
    "../uploads/books/thumbnails",
    oldThumbnail
  );
  fs.unlink(thumbnailPath, (err) => {
    if (err) console.error("Failed to delete thumbnail:", err);
  });

  // Delete the PDF file
  const oldPdf = book.pdf;
  const pdfPath = path.join(__dirname, "../uploads/books/files", oldPdf);
  fs.unlink(pdfPath, (err) => {
    if (err) console.error("Failed to delete file:", err);
  });

  // Delete associated image files
  const oldImages = book.BookImages;
  oldImages.forEach((image) => {
    const imagePath = path.join(
      __dirname,
      "../uploads/books/images",
      image.url
    );
    fs.unlink(imagePath, (err) => {
      if (err) console.error("Failed to delete image:", err);
    });
  });
  await BookImage.destroy({ where: { bookId: book.id } });

  // Delete the book and associated images in the database
  await book.destroy(); // This will also delete related BookImage records if cascading is enabled in your Sequelize associations.

  res.redirect("/books");
});

const getEditBookPage = asyncWrapper(async (req, res) => {
  const book = await Book.findByPk(req.params.id, {
    include: [
      {
        model: BookImage, // Include the BookImage model
        attributes: ["url"], // Specify attributes to fetch
      },
    ],
  });

  if (!book) return res.status(404).send("Book not found");
  if (book.userId !== req.session.userId)
    return res.status(403).send("Unauthorized");

  res.render("book/edit-book", {
    title: "Edit Book",
    userName: req.session.userName,
    book,
    userId: req.session.userId,
  });
});

const updateBook = asyncWrapper(async (req, res) => {
  const { title, author, description } = req.body;
  const errors = {};

  // Validation checks
  if (!title) errors.title = "Title is required";
  if (!author) errors.author = "Author is required";
  if (!description) errors.description = "Description is required";

  // Extract uploaded files
  const thumbnailFile = req.files?.thumbnail?.[0]?.filename; // Handled by uploadThumbnail.single("thumbnail")
  const imageFiles = req.files?.url?.map((file) => file.filename) || []; // Handled by uploadGallery.array("url")
  const pdfFile = req.files?.pdf?.[0]?.filename; // Handled by uploadFile.single("pdf")

  // Find the book to be updated
  const book = await Book.findByPk(req.params.id, {
    include: [{ model: BookImage, attributes: ["url"] }],
  });

  if (!book) return res.status(404).send("Book not found");
  if (book.userId !== req.session.userId)
    return res.status(403).send("Unauthorized");

  // Validate required files if they are uploaded
  if (thumbnailFile) {
    // Delete old thumbnail
    const oldThumbnailPath = path.join(
      __dirname,
      "../uploads/books/thumbnails",
      book.thumbnail
    );
    fs.unlink(oldThumbnailPath, (err) => {
      if (err) console.error("Failed to delete old thumbnail:", err);
    });
  }

  if (pdfFile) {
    // Delete old PDF
    const oldPdfPath = path.join(__dirname, "../uploads/books/files", book.pdf);
    fs.unlink(oldPdfPath, (err) => {
      if (err) console.error("Failed to delete old PDF:", err);
    });
  }

  // Delete old images if new images are uploaded
  if (req.files?.url?.length) {
    const oldImages = book.BookImages.map((image) => image.url);
    oldImages.forEach((image) => {
      const imagePath = path.join(__dirname, "../uploads/books/images", image);
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Failed to delete old image:", err);
      });
    });
    await BookImage.destroy({ where: { bookId: book.id } });
  }

  // Update book data
  const updatedData = {
    title,
    author,
    description,
    userId: req.session.userId,
    thumbnail: thumbnailFile || book.thumbnail, // If no new thumbnail, keep old one
    pdf: pdfFile || book.pdf, // If no new PDF, keep old one
  };

  // Update the book in the database
  await book.update(updatedData);

  // Insert each new image into the BookImage model
  for (const imageFile of imageFiles) {
    await BookImage.create({
      bookId: book.id,
      url: imageFile,
    });
  }

  // Redirect after successful update
  // res.redirect(`/books/${book.id}`);
  res.redirect("/books");
});

module.exports = {
  getAllBooks,
  getBook,
  getAddNewBookPage,
  createBook,
  deleteBook,
  getEditBookPage,
  updateBook,
};

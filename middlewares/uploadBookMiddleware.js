const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;

    // Determine upload directory based on field name
    switch (file.fieldname) {
      case "thumbnail":
        uploadPath = path.join(__dirname, "../uploads/books/thumbnails");
        break;
      case "url":
        uploadPath = path.join(__dirname, "../uploads/books/images");
        break;
      case "pdf":
        uploadPath = path.join(__dirname, "../uploads/books/files");
        break;
      default:
        return cb(new Error("Invalid field name"), false);
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)}${ext}`;
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    thumbnail: ["image"],
    url: ["image"],
    pdf: ["application"],
  };

  const fileType = file.mimetype.split("/")[0];
  const allowed = allowedTypes[file.fieldname] || [];

  if (allowed.includes(fileType)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for field ${file.fieldname}`), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;

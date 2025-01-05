const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

const path = require("path");
const multer = require("multer");

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/profiles");
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    const fileName = `user-${Date.now()}.${ext}`;
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  const imageType = file.mimetype.split("/")[0];

  if (imageType === "image") {
    return cb(null, true);
  } else {
    return cb(appError.create("file must be an image", 400), false);
  }
};

const upload = multer({ storage: diskStorage, fileFilter });

router
  .route("/register")
  .get(userController.getRegisterPage)
  .post(upload.single("avatar"), userController.register);

router
  .route("/register/check-verification")
  .get(userController.getRegisterCheckVerification);

router.route("/register/verify").get(userController.verifyUser);

router
  .route("/login")
  .get(userController.getLoginPage)
  .post(userController.login);

router
  .route("/login/confirm-email")
  .get(userController.getConfirmEmailPage)
  .post(userController.confirmEmail);

router
  .route("/login/check-verify-reset-password")
  .get(userController.getCheckVerifyResetPasswordPage);

router
  .route("/login/reset-password")
  .get(userController.getResetPasswordPage)
  .post(userController.forgetPassword);

router.route("/logout").get(userController.logout);

router.route("/profile").get(authMiddleware, userController.currentUser);

router
  .route("/profile/edit-info")
  .get(authMiddleware, userController.getEditProfilePage)
  .post(authMiddleware, upload.single("avatar"), userController.updateUser);

router.route("/profile/books").get(authMiddleware, userController.getBooksPage);

module.exports = router;

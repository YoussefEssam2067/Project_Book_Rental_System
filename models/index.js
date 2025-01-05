const Sequelize = require("sequelize");
const db = require("../config/database");
const UserModel = require("./user");
const BookModel = require("./book");
const BookImageModel = require("./bookImage");
const RentalModel = require("./rental");
const RatingModel = require("./rating");

const User = UserModel(db, Sequelize);
const Book = BookModel(db, Sequelize);
const BookImage = BookImageModel(db, Sequelize);
const Rental = RentalModel(db, Sequelize);
const Rating = RatingModel(db, Sequelize);

Book.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Book, { foreignKey: "userId" });

BookImage.belongsTo(Book, { foreignKey: "bookId" });
Book.hasMany(BookImage, { foreignKey: "bookId" });

Rental.belongsTo(User, { foreignKey: "userId" });
Rental.belongsTo(Book, { foreignKey: "bookId" });
User.hasMany(Rental, { foreignKey: "userId" });
Book.hasMany(Rental, { foreignKey: "bookId" });

Rating.belongsTo(User, { foreignKey: "userId" });
Rating.belongsTo(Book, { foreignKey: "bookId" });
User.hasMany(Rating, { foreignKey: "userId" });
Book.hasMany(Rating, { foreignKey: "bookId" });

db.sync({ force: false }).then(() => {
  console.log("Tables Created!");
});

module.exports = {
  User,
  Book,
  BookImage,
  Rental,
  Rating,
};

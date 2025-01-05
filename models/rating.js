module.exports = (db, type) => {
  return db.define("Ratings", {
    id: { type: type.INTEGER, primaryKey: true, autoIncrement: true },
    rating: { type: type.INTEGER, allowNull: false },
    review: { type: type.TEXT },
    userId: { type: type.INTEGER, references: { model: "Users", key: "id" } },
    bookId: { type: type.INTEGER, references: { model: "Books", key: "id" } },
  });
};

module.exports = (db, type) => {
  return db.define("Rentals", {
    id: { type: type.INTEGER, primaryKey: true, autoIncrement: true },
    startDate: { type: type.DATE, allowNull: false },
    endDate: { type: type.DATE, allowNull: false },
    status: { type: type.STRING, defaultValue: "pending" },
    userId: { type: type.INTEGER, references: { model: "Users", key: "id" } },
    bookId: { type: type.INTEGER, references: { model: "Books", key: "id" } },
  });
};

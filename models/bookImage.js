module.exports = (db, type) => {
  return db.define("BookImages", {
    id: { type: type.INTEGER, primaryKey: true, autoIncrement: true },
    url: { type: type.STRING, allowNull: false },
    bookId: { type: type.INTEGER, references: { model: "Books", key: "id" } },
  });
};

module.exports = (db, type) => {
  return db.define("Books", {
    id: { type: type.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: type.STRING, allowNull: false },
    author: { type: type.STRING, allowNull: false },
    description: { type: type.TEXT },
    thumbnail: { type: type.STRING },
    pdf: { type: type.STRING, allowNull: false },
    userId: {
      type: type.INTEGER,
      references: { model: "Users", key: "id" },
    },
  });
};

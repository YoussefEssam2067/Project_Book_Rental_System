module.exports = (db, type) => {
  return db.define("Users", {
    id: {
      type: type.INTEGER, // Use INTEGER for ID
      autoIncrement: true, // Enable auto-increment
      primaryKey: true, // Set as primary key
    },
    name: {
      type: type.STRING,
      allowNull: false,
    },
    email: {
      type: type.STRING,
      allowNull: false,
      unique: {
        name: "unique_email",
        msg: "This email address is already in use",
      },
    },
    password: {
      type: type.STRING,
      allowNull: false,
    },
    address: {
      type: type.STRING,
      allowNull: false,
    },
    phone: {
      type: type.STRING,
      validate: {
        isNumeric: true, // Ensures the value contains only numbers
        len: [10, 15], // Restricts length (e.g., between 10 and 15 digits)
      },
    },
    age: type.INTEGER,
    bio: { type: type.TEXT, allowNull: true },
    avatar: {
      type: type.STRING,
      allowNull: true,
      defaultValue: "uploads/profiles/default.png",
    },

    verificationToken: {
      type: type.STRING(64), // Adjust size based on token length
      allowNull: true, // Can be null after verification is complete
    },
    isVerified: {
      type: type.BOOLEAN,
      defaultValue: false,
    },
    resetToken: {
      type: type.STRING,
      allowNull: true, // Allow null when the token is not in use
    },
    resetTokenExpires: {
      type: type.DATE,
      allowNull: true, // Allow null when there's no expiration set
    },
  });
};

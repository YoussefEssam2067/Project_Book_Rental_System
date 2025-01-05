const crypto = require("crypto");

function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex"); // generates a random token
}

module.exports = { generateVerificationToken };

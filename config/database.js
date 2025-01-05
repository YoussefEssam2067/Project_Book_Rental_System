require("dotenv").config();

const Sequelize = require("sequelize");
const config = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  dialect: process.env.DIALECT,
  logging: false,
};

module.exports = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

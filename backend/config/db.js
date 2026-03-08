const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "food_delivery"
});

db.connect(err => {
  if (err) {
    console.error("MySQL Connection Error:", err.message);
    // Don't throw error - allow app to run even without DB initially
  } else {
    console.log("MySQL Connected Successfully");
  }
});

module.exports = db;

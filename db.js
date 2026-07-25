const { Pool } = require("pg");
require("dotenv").config();

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost")
    ? { rejectUnauthorized: false }
    : false,
});

// Test Connection & Initialize Tables (Authors + Books with Foreign Key)
const initDb = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️  DATABASE_URL environment variable is not set. Please check your .env file!");
    return;
  }

  try {
    const client = await pool.connect();
    console.log(" Connected to PostgreSQL Database successfully!");

    // Table 1: Authors
    await client.query(`
      CREATE TABLE IF NOT EXISTS authors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table 2: Books (Foreign Key -> authors.id)
    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        genre VARCHAR(100) NOT NULL,
        published_year INT NOT NULL,
        available BOOLEAN DEFAULT TRUE,
        author_id INT REFERENCES authors(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log(" SQL Tables (authors, books) verified / created successfully!");
    client.release();
  } catch (err) {
    console.error("❌ Database Connection Error:", err.message);
  }
};

module.exports = { pool, initDb };

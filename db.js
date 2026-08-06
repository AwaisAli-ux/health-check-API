const { Pool } = require("pg");
require("dotenv").config();

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost")
    ? { rejectUnauthorized: false }
    : false,
});

// Sample Authors & Books Seeder Data (35+ Records)
const sampleAuthors = [
  { name: "Robert C. Martin", bio: "Software Engineer and Author of Clean Code and Clean Architecture" },
  { name: "Martin Fowler", bio: "Software Architect and Author of Refactoring and Patterns of Enterprise Application Architecture" },
  { name: "Andrew Hunt & David Thomas", bio: "Authors of The Pragmatic Programmer" },
  { name: "Eric Evans", bio: "Pioneer of Domain-Driven Design (DDD)" },
  { name: "Steve McConnell", bio: "Software Engineering Expert and Author of Code Complete" }
];

const sampleBooks = [
  { title: "Clean Code", genre: "Software Engineering", publishedYear: 2008, authorIndex: 0 },
  { title: "The Pragmatic Programmer", genre: "Software Engineering", publishedYear: 1999, authorIndex: 2 },
  { title: "Refactoring: Improving Code Design", genre: "Software Engineering", publishedYear: 1999, authorIndex: 1 },
  { title: "Domain-Driven Design", genre: "System Architecture", publishedYear: 2003, authorIndex: 3 },
  { title: "Code Complete (2nd Edition)", genre: "Software Engineering", publishedYear: 2004, authorIndex: 4 },
  { title: "Clean Architecture", genre: "System Architecture", publishedYear: 2017, authorIndex: 0 },
  { title: "Patterns of Enterprise Architecture", genre: "System Architecture", publishedYear: 2002, authorIndex: 1 },
  { title: "The Clean Coder", genre: "Software Engineering", publishedYear: 2011, authorIndex: 0 },
  { title: "Designing Data-Intensive Applications", genre: "System Architecture", publishedYear: 2017, authorIndex: 1 },
  { title: "Introduction to Algorithms (CLRS)", genre: "Computer Science", publishedYear: 2009, authorIndex: 4 },
  { title: "Structure and Interpretation of Computer Programs", genre: "Computer Science", publishedYear: 1996, authorIndex: 4 },
  { title: "Computer Systems: A Programmer's Perspective", genre: "Computer Science", publishedYear: 2015, authorIndex: 4 },
  { title: "Operating System Concepts", genre: "Computer Science", publishedYear: 2018, authorIndex: 4 },
  { title: "Computer Networking: A Top-Down Approach", genre: "Computer Science", publishedYear: 2021, authorIndex: 3 },
  { title: "The Art of Computer Programming (Vol 1)", genre: "Algorithms", publishedYear: 1997, authorIndex: 4 },
  { title: "Grokking Algorithms", genre: "Algorithms", publishedYear: 2016, authorIndex: 2 },
  { title: "Algorithm Design Manual", genre: "Algorithms", publishedYear: 2020, authorIndex: 4 },
  { title: "Clean Agile", genre: "Software Engineering", publishedYear: 2019, authorIndex: 0 },
  { title: "Continuous Delivery", genre: "System Architecture", publishedYear: 2010, authorIndex: 1 },
  { title: "Building Microservices", genre: "System Architecture", publishedYear: 2021, authorIndex: 1 },
  { title: "Site Reliability Engineering (SRE)", genre: "System Architecture", publishedYear: 2016, authorIndex: 3 },
  { title: "Web Application Hacker's Handbook", genre: "Cybersecurity", publishedYear: 2011, authorIndex: 3 },
  { title: "Practical Malware Analysis", genre: "Cybersecurity", publishedYear: 2012, authorIndex: 3 },
  { title: "Hacking: The Art of Exploitation", genre: "Cybersecurity", publishedYear: 2008, authorIndex: 3 },
  { title: "Black Hat Python", genre: "Cybersecurity", publishedYear: 2021, authorIndex: 3 },
  { title: "Deep Learning (Ian Goodfellow)", genre: "Artificial Intelligence", publishedYear: 2016, authorIndex: 4 },
  { title: "Hands-On Machine Learning with Scikit-Learn & TensorFlow", genre: "Artificial Intelligence", publishedYear: 2022, authorIndex: 4 },
  { title: "Pattern Recognition and Machine Learning", genre: "Artificial Intelligence", publishedYear: 2006, authorIndex: 4 },
  { title: "Artificial Intelligence: A Modern Approach", genre: "Artificial Intelligence", publishedYear: 2020, authorIndex: 4 },
  { title: "The Phoenix Project", genre: "Business Tech", publishedYear: 2013, authorIndex: 2 },
  { title: "The Unicorn Project", genre: "Business Tech", publishedYear: 2019, authorIndex: 2 },
  { title: "Accelerate: Building High Performing IT", genre: "Business Tech", publishedYear: 2018, authorIndex: 2 },
  { title: "Soft Skills: The Software Developer's Manual", genre: "Software Engineering", publishedYear: 2014, authorIndex: 0 },
  { title: "Working Effectively with Legacy Code", genre: "Software Engineering", publishedYear: 2004, authorIndex: 1 },
  { title: "Test-Driven Development by Example", genre: "Software Engineering", publishedYear: 2002, authorIndex: 1 },
  { title: "Enterprise Integration Patterns", genre: "System Architecture", publishedYear: 2003, authorIndex: 1 }
];

const seedDb = async (client) => {
  try {
    const bookCountRes = await client.query("SELECT COUNT(*) FROM books");
    const count = parseInt(bookCountRes.rows[0].count, 10);

    if (count >= 30) {
      return; // Already seeded
    }

    console.log("🌱 Database has fewer than 30 books. Seeding 35+ sample books and authors...");

    // Insert Authors if not present
    const authorIds = [];
    for (const author of sampleAuthors) {
      const existing = await client.query("SELECT id FROM authors WHERE name = $1", [author.name]);
      if (existing.rows.length > 0) {
        authorIds.push(existing.rows[0].id);
      } else {
        const inserted = await client.query(
          "INSERT INTO authors (name, bio) VALUES ($1, $2) RETURNING id",
          [author.name, author.bio]
        );
        authorIds.push(inserted.rows[0].id);
      }
    }

    // Insert Books
    for (const book of sampleBooks) {
      const authorId = authorIds[book.authorIndex] || authorIds[0];
      const bookCheck = await client.query("SELECT id FROM books WHERE title = $1", [book.title]);
      if (bookCheck.rows.length === 0) {
        await client.query(
          "INSERT INTO books (title, genre, published_year, available, author_id) VALUES ($1, $2, $3, true, $4)",
          [book.title, book.genre, book.publishedYear, authorId]
        );
      }
    }

    console.log("✅ Database successfully seeded with 35+ books across 5 authors!");
  } catch (err) {
    console.error("⚠️ Seeding Error:", err.message);
  }
};

// Test Connection & Initialize Tables (Authors + Books + Users + Reviews + Seeder)
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

    // Table 3: Users (Authentication & Password Hashing)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table 4: Reviews (Nested 1-to-N Resource -> books.id & users.id)
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        book_id INT REFERENCES books(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log(" SQL Tables (authors, books, users, reviews) verified / created successfully!");
    
    // Seed Sample Data (35+ books)
    await seedDb(client);

    client.release();
  } catch (err) {
    console.error("❌ Database Connection Error:", err.message);
  }
};

module.exports = { pool, initDb };

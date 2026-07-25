const express = require("express");
require("dotenv").config();
const { pool, initDb } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON body
app.use(express.json());

// Custom Request Logging Middleware (Method + URL + Status Code + Response Time)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Initialize SQL Tables on Startup
initDb();

// 1. Health Check Endpoint (Includes DB Connection Test)
app.get("/health", async (req, res) => {
  try {
    const dbResult = await pool.query("SELECT NOW()");
    res.status(200).json({
      status: "ok",
      database: "connected",
      dbTime: dbResult.rows[0].now,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ==========================================
// 📌 AUTHORS ENDPOINTS (Relational Entity)
// ==========================================

// GET /api/authors - List all authors
app.get("/api/authors", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM authors ORDER BY id ASC");
    res.status(200).json({
      success: true,
      count: result.rowCount,
      data: result.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database Error", error: err.message });
  }
});

// POST /api/authors - Create a new author
app.post("/api/authors", async (req, res) => {
  const { name, bio } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: "Please provide author name" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO authors (name, bio) VALUES ($1, $2) RETURNING *",
      [name, bio || null]
    );
    res.status(201).json({
      success: true,
      message: "Author created successfully",
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database Error", error: err.message });
  }
});

// ==========================================
// 📌 BOOKS CRUD ENDPOINTS (Main Resource with JOIN)
// ==========================================

// GET /api/books - List all books (with Author details via SQL JOIN)
app.get("/api/books", async (req, res) => {
  try {
    const query = `
      SELECT 
        b.id, 
        b.title, 
        b.genre, 
        b.published_year AS "publishedYear", 
        b.available, 
        b.created_at AS "createdAt",
        json_build_object(
          'id', a.id,
          'name', a.name,
          'bio', a.bio
        ) AS author
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      ORDER BY b.id ASC;
    `;
    const result = await pool.query(query);
    res.status(200).json({
      success: true,
      count: result.rowCount,
      data: result.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database Error", error: err.message });
  }
});

// GET /api/books/:id - Get single book by ID
app.get("/api/books/:id", async (req, res) => {
  const bookId = parseInt(req.params.id, 10);
  if (isNaN(bookId)) {
    return res.status(400).json({ success: false, message: "Invalid book ID" });
  }

  try {
    const query = `
      SELECT 
        b.id, 
        b.title, 
        b.genre, 
        b.published_year AS "publishedYear", 
        b.available, 
        b.created_at AS "createdAt",
        json_build_object(
          'id', a.id,
          'name', a.name,
          'bio', a.bio
        ) AS author
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE b.id = $1;
    `;
    const result = await pool.query(query, [bookId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Book with id ${bookId} not found` });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database Error", error: err.message });
  }
});

// POST /api/books - Create a new book
app.post("/api/books", async (req, res) => {
  const { title, genre, publishedYear, available, authorId } = req.body;

  if (!title || !genre || !publishedYear || !authorId) {
    return res.status(400).json({
      success: false,
      message: "Please provide title, genre, publishedYear, and authorId"
    });
  }

  try {
    // Check if author exists
    const authorCheck = await pool.query("SELECT id FROM authors WHERE id = $1", [authorId]);
    if (authorCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Author with id ${authorId} does not exist. Create the author first!`
      });
    }

    const query = `
      INSERT INTO books (title, genre, published_year, available, author_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      title,
      genre,
      Number(publishedYear),
      available !== undefined ? Boolean(available) : true,
      Number(authorId)
    ]);

    res.status(201).json({
      success: true,
      message: "Book created successfully in PostgreSQL Database",
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database Error", error: err.message });
  }
});

// PUT /api/books/:id - Update an existing book
app.put("/api/books/:id", async (req, res) => {
  const bookId = parseInt(req.params.id, 10);
  if (isNaN(bookId)) {
    return res.status(400).json({ success: false, message: "Invalid book ID" });
  }

  const { title, genre, publishedYear, available, authorId } = req.body;

  if (!title || !genre || !publishedYear || !authorId) {
    return res.status(400).json({
      success: false,
      message: "Please provide title, genre, publishedYear, and authorId to update"
    });
  }

  try {
    const query = `
      UPDATE books
      SET title = $1, genre = $2, published_year = $3, available = $4, author_id = $5
      WHERE id = $6
      RETURNING *;
    `;
    const result = await pool.query(query, [
      title,
      genre,
      Number(publishedYear),
      Boolean(available),
      Number(authorId),
      bookId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Book with id ${bookId} not found` });
    }

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database Error", error: err.message });
  }
});

// DELETE /api/books/:id - Delete a book
app.delete("/api/books/:id", async (req, res) => {
  const bookId = parseInt(req.params.id, 10);
  if (isNaN(bookId)) {
    return res.status(400).json({ success: false, message: "Invalid book ID" });
  }

  try {
    const result = await pool.query("DELETE FROM books WHERE id = $1 RETURNING *", [bookId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Book with id ${bookId} not found` });
    }

    res.status(200).json({
      success: true,
      message: "Book deleted successfully from PostgreSQL Database",
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database Error", error: err.message });
  }
});

// Root Endpoint
app.get("/", (req, res) => {
  res.send("PostgreSQL Book Store REST API is running. Try /health, /api/authors, or /api/books");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
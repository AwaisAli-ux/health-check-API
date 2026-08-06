const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const { pool, initDb } = require("./db");
const authenticateToken = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");
const {
  validateSignup,
  validateLogin,
  validateAuthor,
  validateBook,
  validateIdParam
} = require("./middleware/validator");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON body and serve static files
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

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
app.get("/health", async (req, res, next) => {
  try {
    const dbResult = await pool.query("SELECT NOW()");
    res.status(200).json({
      success: true,
      message: "API and PostgreSQL Database are healthy",
      data: {
        status: "ok",
        database: "connected",
        dbTime: dbResult.rows[0].now,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 📌 AUTHENTICATION ENDPOINTS (JWT + Bcrypt)
// ==========================================

// POST /api/auth/signup - Register new user
app.post("/api/auth/signup", validateSignup, async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    // Check if email or username already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email.toLowerCase(), username.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email or username already exists",
        error: {
          code: "DUPLICATE_ENTRY",
          details: "Email or username is already registered."
        }
      });
    }

    // Hash password using bcryptjs
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into PostgreSQL
    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at AS \"createdAt\"",
      [username, email.toLowerCase(), passwordHash]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login - User login & JWT issuance
app.post("/api/auth/login", validateLogin, async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        error: {
          code: "INVALID_CREDENTIALS"
        }
      });
    }

    const user = result.rows[0];

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        error: {
          code: "INVALID_CREDENTIALS"
        }
      });
    }

    // Issue JWT token (with fallback secret key)
    const secretKey = process.env.JWT_SECRET || "super_secret_jwt_key_health_check_api_2026";
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      secretKey,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me - Protected route to get logged-in user profile
app.get("/api/auth/me", authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, created_at AS \"createdAt\" FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
        error: { code: "NOT_FOUND" }
      });
    }

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 📌 AUTHORS ENDPOINTS (Relational Entity)
// ==========================================

// GET /api/authors - List all authors (Public)
app.get("/api/authors", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM authors ORDER BY id ASC");
    res.status(200).json({
      success: true,
      message: "Authors retrieved successfully",
      count: result.rowCount,
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/authors - Create a new author (Protected + Validated)
app.post("/api/authors", authenticateToken, validateAuthor, async (req, res, next) => {
  const { name, bio } = req.body;

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
    next(err);
  }
});

// ==========================================
// 📌 BOOKS CRUD ENDPOINTS (Main Resource with JOIN)
// ==========================================

// GET /api/books - List all books (with Author details via SQL JOIN)
app.get("/api/books", async (req, res, next) => {
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
      message: "Books retrieved successfully",
      count: result.rowCount,
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/books/:id - Get single book by ID
app.get("/api/books/:id", validateIdParam, async (req, res, next) => {
  const bookId = parseInt(req.params.id, 10);

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
      return res.status(404).json({
        success: false,
        message: `Book with id ${bookId} not found`,
        error: { code: "NOT_FOUND" }
      });
    }

    res.status(200).json({
      success: true,
      message: "Book retrieved successfully",
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/books - Create a new book (Protected + Validated)
app.post("/api/books", authenticateToken, validateBook, async (req, res, next) => {
  const { title, genre, publishedYear, available, authorId } = req.body;

  try {
    // Check if author exists
    const authorCheck = await pool.query("SELECT id FROM authors WHERE id = $1", [authorId]);
    if (authorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Author with id ${authorId} does not exist. Create the author first!`,
        error: { code: "NOT_FOUND" }
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
    next(err);
  }
});

// PUT /api/books/:id - Update an existing book (Protected + Validated)
app.put("/api/books/:id", authenticateToken, validateIdParam, validateBook, async (req, res, next) => {
  const bookId = parseInt(req.params.id, 10);
  const { title, genre, publishedYear, available, authorId } = req.body;

  try {
    // Check if author exists
    const authorCheck = await pool.query("SELECT id FROM authors WHERE id = $1", [authorId]);
    if (authorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Author with id ${authorId} does not exist. Create the author first!`,
        error: { code: "NOT_FOUND" }
      });
    }

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
      return res.status(404).json({
        success: false,
        message: `Book with id ${bookId} not found`,
        error: { code: "NOT_FOUND" }
      });
    }

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/books/:id - Delete a book (Protected + Validated)
app.delete("/api/books/:id", authenticateToken, validateIdParam, async (req, res, next) => {
  const bookId = parseInt(req.params.id, 10);

  try {
    const result = await pool.query("DELETE FROM books WHERE id = $1 RETURNING *", [bookId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Book with id ${bookId} not found`,
        error: { code: "NOT_FOUND" }
      });
    }

    res.status(200).json({
      success: true,
      message: "Book deleted successfully from PostgreSQL Database",
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// Root Endpoint - Serves HTML Frontend Portal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Centralized Global Error Handler (Registered as last middleware)
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON body
app.use(express.json());

// Custom Request Logging Middleware (method + path + response time)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// In-Memory Data Store for Books
let books = [
  {
    id: "1",
    title: "Clean Code",
    author: "Robert C. Martin",
    genre: "Software Engineering",
    publishedYear: 2008,
    available: true
  },
  {
    id: "2",
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt & David Thomas",
    genre: "Software Engineering",
    publishedYear: 1999,
    available: true
  }
];

let nextId = 3;

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /api/books - Get all books
app.get("/api/books", (req, res) => {
  res.status(200).json({
    success: true,
    count: books.length,
    data: books
  });
});

// GET /api/books/:id - Get a single book by ID
app.get("/api/books/:id", (req, res) => {
  const book = books.find((b) => b.id === req.params.id);
  if (!book) {
    return res.status(404).json({
      success: false,
      message: `Book with id ${req.params.id} not found`
    });
  }
  res.status(200).json({
    success: true,
    data: book
  });
});

// POST /api/books - Create a new book
app.post("/api/books", (req, res) => {
  const { title, author, genre, publishedYear, available } = req.body;

  if (!title || !author || !genre || !publishedYear) {
    return res.status(400).json({
      success: false,
      message: "Please provide title, author, genre, and publishedYear"
    });
  }

  const newBook = {
    id: String(nextId++),
    title,
    author,
    genre,
    publishedYear: Number(publishedYear),
    available: available !== undefined ? Boolean(available) : true
  };

  books.push(newBook);

  res.status(201).json({
    success: true,
    message: "Book created successfully",
    data: newBook
  });
});

// PUT /api/books/:id - Update a book by ID
app.put("/api/books/:id", (req, res) => {
  const bookIndex = books.findIndex((b) => b.id === req.params.id);
  if (bookIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Book with id ${req.params.id} not found`
    });
  }

  const { title, author, genre, publishedYear, available } = req.body;

  if (!title || !author || !genre || !publishedYear) {
    return res.status(400).json({
      success: false,
      message: "Please provide title, author, genre, and publishedYear to update"
    });
  }

  books[bookIndex] = {
    id: req.params.id,
    title,
    author,
    genre,
    publishedYear: Number(publishedYear),
    available: available !== undefined ? Boolean(available) : books[bookIndex].available
  };

  res.status(200).json({
    success: true,
    message: "Book updated successfully",
    data: books[bookIndex]
  });
});

// DELETE /api/books/:id - Delete a book by ID
app.delete("/api/books/:id", (req, res) => {
  const bookIndex = books.findIndex((b) => b.id === req.params.id);
  if (bookIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Book with id ${req.params.id} not found`
    });
  }

  const deletedBook = books.splice(bookIndex, 1)[0];

  res.status(200).json({
    success: true,
    message: "Book deleted successfully",
    data: deletedBook
  });
});

// Root Endpoint
app.get("/", (req, res) => {
  res.send("Book Store CRUD API is running. Check /health or /api/books");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
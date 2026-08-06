# PostgreSQL Relational Book Store REST API with JWT Auth, Pagination & Reviews

A production-grade RESTful API built with **Node.js, Express, PostgreSQL, bcryptjs, express-validator, and JSON Web Tokens (JWT)** as part of the **Neurofive Solutions** internship program.

---

## 🎯 Purpose & Features

- **Nested Relational Entities (1-to-N)**: 3-tier relational database structure (`authors` -> `books` -> `reviews`).
- **Pagination, Filtering & Search**: Efficient querying across large datasets (`?page=1&limit=10&search=Clean&genre=Software Engineering&sortBy=publishedYear&sortOrder=DESC`).
- **35+ Sample Data Seeder**: Built-in automatic database seeder populating 35+ realistic books across 5 authors.
- **Bulletproof Input Validation**: Enforced schemas using `express-validator` across all input endpoints.
- **Centralized Global Error Handler**: Express error middleware intercepting malformed JSON payloads (`SyntaxError`), PostgreSQL constraint violations (duplicate keys, foreign key mismatches), and uncaught exceptions.
- **User Authentication & Password Hashing**: Secure Signup and Login endpoints with password hashing using `bcryptjs` (salt rounds = 10).
- **JWT Authorization**: Issue signed JSON Web Tokens upon login with configurable expiration (`1h`).

---

## 🗄️ Database Architecture & Relational Schema

### 1. `users` Table (Authentication & Password Security)
| Column | Type | Constraints |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `username` | `VARCHAR(100)` | `UNIQUE`, `NOT NULL` |
| `email` | `VARCHAR(255)` | `UNIQUE`, `NOT NULL` |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` (Hashed with `bcryptjs`) |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |

### 2. `authors` Table
| Column | Type | Constraints |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `name` | `VARCHAR(255)` | `NOT NULL` |
| `bio` | `TEXT` | Optional |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |

### 3. `books` Table (Relational Entity)
| Column | Type | Constraints |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `title` | `VARCHAR(255)` | `NOT NULL` |
| `genre` | `VARCHAR(100)` | `NOT NULL` |
| `published_year` | `INT` | `NOT NULL` |
| `available` | `BOOLEAN` | `DEFAULT TRUE` |
| `author_id` | `INT` | `FOREIGN KEY REFERENCES authors(id) ON DELETE CASCADE` |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |

### 4. `reviews` Table (Nested 1-to-N Resource)
| Column | Type | Constraints |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `rating` | `INT` | `NOT NULL CHECK (rating >= 1 AND rating <= 5)` |
| `comment` | `TEXT` | `NOT NULL` |
| `book_id` | `INT` | `FOREIGN KEY REFERENCES books(id) ON DELETE CASCADE` |
| `user_id` | `INT` | `FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE` |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |

---

## ⚡ Query-Based Filtering, Sorting & Pagination (`GET /api/books`)

Query large datasets with flexible URL parameters:

```http
GET /api/books?page=1&limit=10&search=Clean&genre=Software%20Engineering&sortBy=publishedYear&sortOrder=DESC
```

### Response Payload:
```json
{
  "success": true,
  "message": "Books retrieved successfully",
  "pagination": {
    "currentPage": 1,
    "totalPages": 4,
    "totalItems": 36,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "data": [
    {
      "id": 1,
      "title": "Clean Code",
      "genre": "Software Engineering",
      "publishedYear": 2008,
      "available": true,
      "createdAt": "2026-08-06T04:50:00.000Z",
      "author": {
        "id": 1,
        "name": "Robert C. Martin",
        "bio": "Author of Clean Code"
      }
    }
  ]
}
```

---

## 🔗 Nested Resource Endpoints

- **Get all books by author**: `GET /api/authors/:id/books`
- **Get all reviews for a book**: `GET /api/books/:id/reviews`
- **Add a review for a book**: `POST /api/books/:id/reviews` (Protected with JWT)

---

## 📌 API Endpoints Overview

| Method | Endpoint | Access | Description | Status Codes |
|--------|----------|--------|-------------|--------------|
| `GET` | `/health` | Public | Health check + SQL DB connectivity | `200 OK`, `500 Error` |
| `POST` | `/api/auth/signup` | Public | Register new user (Validated & Hashed) | `201 Created`, `400 Bad Request`, `409 Conflict` |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT token | `200 OK`, `400 Bad Request`, `401 Unauthorized` |
| `GET` | `/api/auth/me` | **Protected** | Fetch authenticated user profile | `200 OK`, `401 Unauthorized` |
| `GET` | `/api/authors` | Public | List all authors | `200 OK`, `500 Error` |
| `GET` | `/api/authors/:id/books` | Public | **Nested**: Get all books by specific author | `200 OK`, `404 Not Found` |
| `POST` | `/api/authors` | **Protected** | Create a new author (Validated) | `201 Created`, `400 Bad Request` |
| `GET` | `/api/books` | Public | **Paginated, Filtered, Searched & Sorted** Books | `200 OK`, `400 Bad Request` |
| `GET` | `/api/books/:id` | Public | Get single book by ID | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `GET` | `/api/books/:id/reviews` | Public | **Nested**: Get all reviews for a book | `200 OK`, `404 Not Found` |
| `POST` | `/api/books/:id/reviews` | **Protected** | **Nested**: Add a review to a book | `201 Created`, `400 Bad Request`, `401 Unauthorized` |
| `POST` | `/api/books` | **Protected** | Create a book (Validated) | `201 Created`, `400 Bad Request` |
| `PUT` | `/api/books/:id` | **Protected** | Update an existing book | `200 OK`, `400 Bad Request` |
| `DELETE` | `/api/books/:id` | **Protected** | Delete a book by ID | `200 OK`, `400 Bad Request` |

---

## 🚀 Local Setup & Running Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/AwaisAli-ux/health-check-API.git
   cd health-check-API
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, and `JWT_EXPIRES_IN`.

4. **Run server**
   ```bash
   npm start
   ```
   Open `http://localhost:3000` to interact with the visual frontend portal featuring search, pagination, and review submission!
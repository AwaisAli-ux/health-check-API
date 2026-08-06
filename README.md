# PostgreSQL Relational Book Store REST API with JWT Auth & Input Validation

A production-grade RESTful API built with **Node.js, Express, PostgreSQL, bcryptjs, express-validator, and JSON Web Tokens (JWT)** as part of the **Neurofive Solutions** internship program.

---

## 🎯 Purpose & Features

- **Bulletproof Input Validation**: Enforced schemas using `express-validator` across all input endpoints (email validation, string length limits, numeric ranges, sanitization).
- **Centralized Global Error Handler**: Express error middleware intercepting malformed JSON payloads (`SyntaxError`), PostgreSQL constraint violations (duplicate keys, foreign key mismatches), and uncaught runtime exceptions without leaking stack traces.
- **Standardized API Contract**: Consistent JSON response shape `{ success, message, data/error }` across all success and error scenarios.
- **User Authentication & Password Hashing**: Secure Signup and Login endpoints with password hashing using `bcryptjs` (salt rounds = 10).
- **JWT Authorization**: Issue signed JSON Web Tokens upon login with configurable expiration (`1h`).
- **Protected Routes**: Middleware (`authenticateToken`) guarding data modification (`POST`, `PUT`, `DELETE`) and user profile retrieval.

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

---

## 🛡️ Input Validation & Standardized Error Handling (5 Bad Request Examples)

The API enforces strict validation rules and returns consistent error structures.

### Standardized Error Contract:
```json
{
  "success": false,
  "message": "Human readable error description",
  "error": {
    "code": "ERROR_CODE_IDENTIFIER",
    "details": "Detailed validation failures or DB details"
  }
}
```

---

### 1️⃣ Bad Request 1: Malformed JSON Syntax (`POST /api/auth/signup`)
**Request:** Malformed JSON payload (`{ "username": "test", "email": `)
**Response:** `400 Bad Request`
```json
{
  "success": false,
  "message": "Malformed JSON payload in request body",
  "error": {
    "code": "MALFORMED_JSON",
    "details": "Please check your JSON formatting and syntax."
  }
}
```

### 2️⃣ Bad Request 2: Invalid Email & Short Password (`POST /api/auth/signup`)
**Request Payload:**
```json
{
  "username": "user123",
  "email": "invalid-email-format",
  "password": "123"
}
```
**Response:** `400 Bad Request`
```json
{
  "success": false,
  "message": "Input validation failed. Please correct the invalid fields.",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address",
        "value": "invalid-email-format"
      },
      {
        "field": "password",
        "message": "Password must be at least 6 characters long",
        "value": "123"
      }
    ]
  }
}
```

### 3️⃣ Bad Request 3: Non-Numeric ID Parameter (`GET /api/books/invalid_abc`)
**Request:** `GET /api/books/invalid_abc`
**Response:** `400 Bad Request`
```json
{
  "success": false,
  "message": "Input validation failed. Please correct the invalid fields.",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "id",
        "message": "ID parameter must be a positive integer",
        "value": "invalid_abc"
      }
    ]
  }
}
```

### 4️⃣ Bad Request 4: Duplicate User Registration (`POST /api/auth/signup`)
**Request Payload:** Register email or username that already exists in DB
**Response:** `409 Conflict`
```json
{
  "success": false,
  "message": "User with this email or username already exists",
  "error": {
    "code": "DUPLICATE_ENTRY",
    "details": "Email or username is already registered."
  }
}
```

### 5️⃣ Bad Request 5: Out-of-Range Published Year (`POST /api/books`)
**Request Payload:**
```json
{
  "title": "Clean Code",
  "genre": "Tech",
  "publishedYear": 99,
  "authorId": 1
}
```
**Response:** `400 Bad Request`
```json
{
  "success": false,
  "message": "Input validation failed. Please correct the invalid fields.",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "publishedYear",
        "message": "Published year must be a valid integer between 1000 and 2030",
        "value": 99
      }
    ]
  }
}
```

---

## 🔐 Environment Variables Configuration (`.env`)

Create a `.env` file in the project root:

```env
PORT=3000
DATABASE_URL=postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require
JWT_SECRET=super_secret_jwt_key_health_check_api_2026
JWT_EXPIRES_IN=1h
```

---

## 📌 API Endpoints Overview

| Method | Endpoint | Access | Description | Status Codes |
|--------|----------|--------|-------------|--------------|
| `GET` | `/health` | Public | Health check + SQL DB connectivity | `200 OK`, `500 Error` |
| `POST` | `/api/auth/signup` | Public | Register new user (Validated & Hashed) | `201 Created`, `400 Bad Request`, `409 Conflict` |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT token | `200 OK`, `400 Bad Request`, `401 Unauthorized` |
| `GET` | `/api/auth/me` | **Protected** | Fetch authenticated user profile | `200 OK`, `401 Unauthorized` |
| `GET` | `/api/authors` | Public | List all authors | `200 OK`, `500 Error` |
| `POST` | `/api/authors` | **Protected** | Create a new author (Validated) | `201 Created`, `400 Bad Request`, `401 Unauthorized` |
| `GET` | `/api/books` | Public | Get all books with author info via SQL `JOIN` | `200 OK`, `500 Error` |
| `GET` | `/api/books/:id` | Public | Get single book by ID | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `POST` | `/api/books` | **Protected** | Create a book linked to `author_id` (Validated) | `201 Created`, `400 Bad Request`, `401 Unauthorized` |
| `PUT` | `/api/books/:id` | **Protected** | Update an existing book (Validated) | `200 OK`, `400 Bad Request`, `401 Unauthorized` |
| `DELETE` | `/api/books/:id` | **Protected** | Delete a book by ID | `200 OK`, `400 Bad Request`, `401 Unauthorized` |

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
   Open `http://localhost:3000` to interact with the visual frontend portal.

---

## 🧪 Postman Testing

Import [`postman_collection.json`](./postman_collection.json) directly into Postman to test validation errors, JWT authentication, and CRUD endpoints.
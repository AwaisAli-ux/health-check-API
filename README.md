# PostgreSQL Relational Book Store REST API with JWT Auth

A production-grade RESTful API built with **Node.js, Express, PostgreSQL, bcryptjs, and JSON Web Tokens (JWT)** as part of the **Neurofive Solutions** internship program.

---

## 🎯 Purpose & Features

- **User Authentication**: Secure Signup and Login endpoints with password hashing using `bcryptjs` (salt rounds = 10).
- **JWT Authorization**: Issue signed JSON Web Tokens upon login with configurable expiration (`1h`).
- **Protected Routes**: Middleware (`authenticateToken`) guarding data modification (`POST`, `PUT`, `DELETE`) and user profile retrieval.
- **Relational PostgreSQL Database**: Managed tables (`authors`, `books`, `users`) hosted on cloud PostgreSQL with foreign key constraints.
- **Robust Error Handling**: Standardized 401 response formats for missing tokens, expired tokens, invalid credentials, and duplicate users.

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

## 🔐 Environment Variables Configuration (`.env`)

Create a `.env` file in the project root:

```env
PORT=3000
DATABASE_URL=postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require
JWT_SECRET=super_secret_jwt_key_health_check_api_2026
JWT_EXPIRES_IN=1h
```

> 🔒 **Security Note**: `JWT_SECRET` and `DATABASE_URL` are kept strictly in `.env` and excluded from Git tracking.

---

## 🔑 Authentication Flow & How To Use Tokens

### 1️⃣ Signup (`POST /api/auth/signup`)
Send JSON payload to register:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password123!"
}
```

### 2️⃣ Login & Retrieve JWT (`POST /api/auth/login`)
Login to obtain a JWT token:
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```
**Successful Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

### 3️⃣ Accessing Protected Routes
To access protected endpoints, pass the received token in the `Authorization` request header:
```http
Authorization: Bearer <your_jwt_token_here>
```

---

## 📌 API Endpoints Overview

| Method | Endpoint | Access | Description | Status Codes |
|--------|----------|--------|-------------|--------------|
| `GET` | `/health` | Public | Health check + SQL DB connectivity | `200 OK`, `500 Error` |
| `POST` | `/api/auth/signup` | Public | Register new user with hashed password | `201 Created`, `400 Bad Request` |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT token | `200 OK`, `401 Unauthorized` |
| `GET` | `/api/auth/me` | **Protected** | Fetch authenticated user profile | `200 OK`, `401 Unauthorized` |
| `GET` | `/api/authors` | Public | List all authors | `200 OK`, `500 Error` |
| `POST` | `/api/authors` | **Protected** | Create a new author | `201 Created`, `401 Unauthorized` |
| `GET` | `/api/books` | Public | Get all books with author info via SQL `JOIN` | `200 OK`, `500 Error` |
| `GET` | `/api/books/:id` | Public | Get single book by ID with author info | `200 OK`, `404 Not Found` |
| `POST` | `/api/books` | **Protected** | Create a book linked to `author_id` | `201 Created`, `401 Unauthorized` |
| `PUT` | `/api/books/:id` | **Protected** | Update an existing book | `200 OK`, `401 Unauthorized` |
| `DELETE` | `/api/books/:id` | **Protected** | Delete a book by ID | `200 OK`, `401 Unauthorized` |

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
   Tables (`authors`, `books`, `users`) will automatically be verified and created on startup.

---

## 🧪 Postman Testing

Import [`postman_collection.json`](./postman_collection.json) directly into Postman to test Signup, Login, Profile retrieval, and protected book/author requests with Bearer tokens.
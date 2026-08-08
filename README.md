# PostgreSQL Relational Book Store REST API with JWT Auth, Pagination & File Uploads

A production-grade RESTful API built with **Node.js, Express, PostgreSQL, Multer, bcryptjs, express-validator, and JSON Web Tokens (JWT)** as part of the **Neurofive Solutions** internship program.

---

## 🎯 Purpose & Features

- **Real File Uploads & Storage (`Multer`)**: Multipart form-data file uploads for user avatars and book cover images with static public URL generation (`/uploads/avatars/...`).
- **File Type & Size Validation**: Strict MIME type filtering (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`) and 5MB maximum file size enforcement with clean error responses.
- **Database Linking**: Uploaded file URLs linked directly back to PostgreSQL resources (`users.avatar_url` & `books.cover_image_url`).
- **Nested Relational Entities (1-to-N)**: 3-tier relational database structure (`authors` -> `books` -> `reviews`).
- **Pagination, Filtering & Search**: Efficient querying across large datasets (`?page=1&limit=10&search=Clean&genre=Software Engineering&sortBy=publishedYear&sortOrder=DESC`).
- **35+ Sample Data Seeder**: Built-in automatic database seeder populating 35+ realistic books across 5 authors.
- **Bulletproof Input Validation & Centralized Error Handler**: Declarative schemas (`express-validator`) and global error middleware (`middleware/errorHandler.js`).
- **User Authentication & JWT Authorization**: Password hashing with `bcryptjs` and signed JSON Web Tokens.

---

## 🗄️ Database Architecture & Relational Schema

### 1. `users` Table (Authentication & Avatar Storage)
| Column | Type | Constraints |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `username` | `VARCHAR(100)` | `UNIQUE`, `NOT NULL` |
| `email` | `VARCHAR(255)` | `UNIQUE`, `NOT NULL` |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` (Hashed with `bcryptjs`) |
| `avatar_url` | `VARCHAR(500)` | Optional (Public static link to uploaded avatar) |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |

### 2. `authors` Table
| Column | Type | Constraints |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `name` | `VARCHAR(255)` | `NOT NULL` |
| `bio` | `TEXT` | Optional |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |

### 3. `books` Table (Relational Entity & Cover Image)
| Column | Type | Constraints |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `title` | `VARCHAR(255)` | `NOT NULL` |
| `genre` | `VARCHAR(100)` | `NOT NULL` |
| `published_year` | `INT` | `NOT NULL` |
| `available` | `BOOLEAN` | `DEFAULT TRUE` |
| `author_id` | `INT` | `FOREIGN KEY REFERENCES authors(id) ON DELETE CASCADE` |
| `cover_image_url` | `VARCHAR(500)` | Optional (Public static link to book cover) |
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

## 🖼️ Real File Uploads & Storage API (`POST /api/users/avatar` & `POST /api/books/:id/cover`)

### Upload Rules & Constraints:
- **Form Data Field**: `avatar` (for user profile) or `cover` (for book cover).
- **Allowed MIME Types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`.
- **Max File Size**: **5MB** (`5 * 1024 * 1024` bytes).
- **Public URL Format**: `http://localhost:3000/uploads/avatars/avatar-username-timestamp.png`

### 1️⃣ Upload User Avatar (`POST /api/users/avatar`)
**Header:** `Authorization: Bearer <your_jwt_token>`
**Body:** `multipart/form-data` with field `avatar` = `[File]`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User profile avatar uploaded and linked successfully",
  "data": {
    "userId": 1,
    "avatarUrl": "http://localhost:3000/uploads/avatars/avatar-john_pic-1786182989.png",
    "filename": "avatar-john_pic-1786182989.png",
    "sizeBytes": 42560,
    "mimeType": "image/png"
  }
}
```

### 2️⃣ Upload Book Cover (`POST /api/books/:id/cover`)
**Header:** `Authorization: Bearer <your_jwt_token>`
**Body:** `multipart/form-data` with field `cover` = `[File]`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Book cover image uploaded and linked successfully for 'Clean Code'",
  "data": {
    "bookId": 1,
    "title": "Clean Code",
    "coverImageUrl": "http://localhost:3000/uploads/covers/cover-clean_code-1786182990.jpg",
    "filename": "cover-clean_code-1786182990.jpg",
    "sizeBytes": 105400,
    "mimeType": "image/jpeg"
  }
}
```

---

## ⚡ Query-Based Filtering, Sorting & Pagination (`GET /api/books`)

Query large datasets with flexible URL parameters:

```http
GET /api/books?page=1&limit=10&search=Clean&genre=Software%20Engineering&sortBy=publishedYear&sortOrder=DESC
```

---

## 📌 API Endpoints Overview

| Method | Endpoint | Access | Description | Status Codes |
|--------|----------|--------|-------------|--------------|
| `GET` | `/health` | Public | Health check + SQL DB connectivity | `200 OK`, `500 Error` |
| `POST` | `/api/auth/signup` | Public | Register new user (Validated & Hashed) | `201 Created`, `400 Bad Request`, `409 Conflict` |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT token | `200 OK`, `400 Bad Request`, `401 Unauthorized` |
| `GET` | `/api/auth/me` | **Protected** | Fetch authenticated user profile | `200 OK`, `401 Unauthorized` |
| `POST` | `/api/users/avatar` | **Protected** | **Upload User Profile Avatar** (Max 5MB) | `200 OK`, `400 Bad Request`, `401 Unauthorized` |
| `POST` | `/api/books/:id/cover` | **Protected** | **Upload Book Cover Image** (Max 5MB) | `200 OK`, `400 Bad Request`, `401 Unauthorized` |
| `GET` | `/api/authors` | Public | List all authors | `200 OK`, `500 Error` |
| `GET` | `/api/authors/:id/books` | Public | **Nested**: Get all books by specific author | `200 OK`, `404 Not Found` |
| `POST` | `/api/authors` | **Protected** | Create a new author | `201 Created`, `400 Bad Request` |
| `GET` | `/api/books` | Public | **Paginated, Filtered, Searched & Sorted** Books | `200 OK`, `400 Bad Request` |
| `GET` | `/api/books/:id` | Public | Get single book by ID | `200 OK`, `404 Not Found` |
| `GET` | `/api/books/:id/reviews` | Public | **Nested**: Get all reviews for a book | `200 OK`, `404 Not Found` |
| `POST` | `/api/books/:id/reviews` | **Protected** | **Nested**: Add a review to a book | `201 Created`, `400 Bad Request`, `401 Unauthorized` |
| `POST` | `/api/books` | **Protected** | Create a book | `201 Created`, `400 Bad Request` |
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
   Open `http://localhost:3000` to interact with the visual frontend portal featuring file uploads, search, pagination, and review submission!
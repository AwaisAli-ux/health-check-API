# PostgreSQL Relational Book Store CRUD API (Task 3)

A production-grade RESTful API built with **Node.js, Express, and PostgreSQL** as part of the **Neurofive Solutions** internship program.

##  Purpose
Migrate from in-memory storage to a real **PostgreSQL Relational Database**, implementing foreign key relationships (`authors` 1-to-N `books`), parameterized SQL queries to prevent SQL injection, environment variable security, and graceful database error handling.

---

## 🗄️ Database Architecture & Relational Schema

### 1. `authors` Table
| Column | Type | Constraints |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `name` | `VARCHAR(255)` | `NOT NULL` |
| `bio` | `TEXT` | Optional |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |

### 2. `books` Table (Relational Entity)
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

## 🛠️ Environment Variables Configuration (`.env`)

Create a `.env` file in the project root:

```env
PORT=3000
DATABASE_URL=postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require
```

> 🔒 **Security Note**: Secrets and credentials are stored in `.env` and excluded from Git tracking via `.gitignore`.

---

## 📌 API Endpoints

| Method | Endpoint | Description | Status Codes |
|--------|----------|-------------|--------------|
| `GET` | `/health` | Health check + SQL DB connectivity status | `200 OK`, `500 Error` |
| `GET` | `/api/authors` | List all authors | `200 OK`, `500 Error` |
| `POST` | `/api/authors` | Create a new author | `201 Created`, `400 Bad Request` |
| `GET` | `/api/books` | Get all books with author info via SQL `JOIN` | `200 OK`, `500 Error` |
| `GET` | `/api/books/:id` | Get single book by ID with author info | `200 OK`, `404 Not Found` |
| `POST` | `/api/books` | Create a book linked to `author_id` | `201 Created`, `400 Bad Request` |
| `PUT` | `/api/books/:id` | Update an existing book | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/api/books/:id` | Delete a book by ID | `200 OK`, `404 Not Found` |

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
   Copy `.env.example` to `.env` and set your PostgreSQL connection string (`DATABASE_URL`).

4. **Run server**
   ```bash
   npm start
   ```
   Tables will automatically be created on server startup.

---

## 🧪 Postman Testing

Import [`postman_collection.json`](./postman_collection.json) directly into Postman to test all endpoints.
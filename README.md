# Book Store CRUD API (In-Memory)

A full RESTful CRUD API built with Node.js and Express as part of the **Neurofive Solutions** internship program.

##  Purpose
Demonstrate basic REST conventions, in-memory data management, proper HTTP status code handling, custom request logging, and endpoint testing with Postman.

## 🛠️ Tech Stack & Features
- **Runtime**: Node.js & Express.js
- **Data Persistence**: In-Memory (JS Array)
- **Request Logging**: Custom middleware logging `[METHOD] URL - Status (ResponseTime)`
- **Exported Postman Collection**: [`postman_collection.json`](./postman_collection.json)

---

## 📌 API Endpoints & REST Conventions

| Method | Endpoint | Description | Expected Status Codes |
|--------|----------|-------------|-----------------------|
| `GET` | `/health` | Health Check Endpoint | `200 OK` |
| `GET` | `/api/books` | Get all books | `200 OK` |
| `GET` | `/api/books/:id` | Get single book by ID | `200 OK`, `404 Not Found` |
| `POST` | `/api/books` | Create a new book | `201 Created`, `400 Bad Request` |
| `PUT` | `/api/books/:id` | Update an existing book by ID | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/api/books/:id` | Delete a book by ID | `200 OK`, `404 Not Found` |

---

##  Resource Schema (Book)

Each Book entity contains 5 fields:
```json
{
  "id": "1",
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "genre": "Software Engineering",
  "publishedYear": 2008,
  "available": true
}
```

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

3. **Run local server**
   ```bash
   npm start
   ```
   Server will run on `http://localhost:3000`.

---

## 🌐 Live Public Deployment

- **Base URL**: `https://health-check-api-pp9b.onrender.com`
- **Health Check**: `https://health-check-api-pp9b.onrender.com/health`
- **Books Resource**: `https://health-check-api-pp9b.onrender.com/api/books`

---

## 🧪 Testing with Postman

1. Open **Postman**.
2. Click **Import** button in the top-left corner.
3. Select and upload [`postman_collection.json`](./postman_collection.json) from this project folder.
4. Run requests to test `GET`, `POST`, `PUT`, and `DELETE`.
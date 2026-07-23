 Health Check API

A minimal backend service exposing a health-check endpoint.
Built as part of the Neurofive Solutions internship program.

 Purpose
Verify that the local environment, version control, and deployment
pipeline work end-to-end before building complex features.

 Tech Stack
- Node.js
- Express.js

Setup

1. Clone the repository
   git clone https://github.com/AwaisAli-ux/health-check-api.git
   cd health-check-api

2. Install dependencies
   npm install

3. Run locally
   npm start

Server starts at http://localhost:3000

 Endpoints

| Method | Route    | Description         |
|--------|----------|---------------------|
| GET    | /health  | Returns service status |

 Sample Response
{
  "status": "ok",
  "timestamp": "2026-07-21T10:00:00.000Z",
  "uptime": 12.34
}

 Live URL
https://your-app.onrender.com/health
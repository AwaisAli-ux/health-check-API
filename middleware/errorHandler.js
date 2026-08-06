/**
 * Centralized Global Error Handler Middleware
 * Catches all errors, malformed JSON, and PostgreSQL errors without leaking stack traces.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`❌ [ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  // 1. Malformed JSON Body Error (SyntaxError)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON payload in request body",
      error: {
        code: "MALFORMED_JSON",
        details: "Please check your JSON formatting and syntax."
      }
    });
  }

  // 2. PostgreSQL Database Unique Constraint Violation (Duplicate Key)
  if (err.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "Resource already exists with duplicate unique field",
      error: {
        code: "DUPLICATE_ENTRY",
        details: err.detail || err.message
      }
    });
  }

  // 3. PostgreSQL Database Foreign Key Violation
  if (err.code === "23503") {
    return res.status(400).json({
      success: false,
      message: "Referenced relational record (e.g. authorId) does not exist",
      error: {
        code: "FOREIGN_KEY_VIOLATION",
        details: err.detail || err.message
      }
    });
  }

  // 4. PostgreSQL Database Invalid Data Type
  if (err.code === "22P02") {
    return res.status(400).json({
      success: false,
      message: "Invalid data type provided for database column",
      error: {
        code: "INVALID_DATA_TYPE",
        details: err.message
      }
    });
  }

  // 5. Custom Status Errors
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || (statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR");

  return res.status(statusCode).json({
    success: false,
    message: err.message || "An unexpected internal server error occurred",
    error: {
      code: errorCode,
      details: err.details || undefined
    }
  });
};

module.exports = errorHandler;

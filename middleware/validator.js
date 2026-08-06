const { body, param, query, validationResult } = require("express-validator");

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const formattedErrors = errors.array().map(err => ({
    field: err.path,
    message: err.msg,
    value: err.value
  }));

  return res.status(400).json({
    success: false,
    message: "Input validation failed. Please correct the invalid fields.",
    error: {
      code: "VALIDATION_ERROR",
      details: formattedErrors
    }
  });
};

// 1. User Signup Validation Schema
const validateSignup = [
  body("username")
    .trim()
    .notEmpty().withMessage("Username is required")
    .isLength({ min: 3, max: 30 }).withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers, and underscores"),
  
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Must be a valid email address")
    .normalizeEmail(),
  
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  
  validate
];

// 2. User Login Validation Schema
const validateLogin = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Must be a valid email address")
    .normalizeEmail(),
  
  body("password")
    .notEmpty().withMessage("Password is required"),
  
  validate
];

// 3. Author Creation Validation Schema
const validateAuthor = [
  body("name")
    .trim()
    .notEmpty().withMessage("Author name is required")
    .isLength({ min: 2, max: 255 }).withMessage("Author name must be between 2 and 255 characters"),
  
  body("bio")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 }).withMessage("Bio must not exceed 1000 characters"),
  
  validate
];

// 4. Book Creation & Update Validation Schema
const validateBook = [
  body("title")
    .trim()
    .notEmpty().withMessage("Book title is required")
    .isLength({ min: 1, max: 255 }).withMessage("Title must be between 1 and 255 characters"),
  
  body("genre")
    .trim()
    .notEmpty().withMessage("Genre is required")
    .isLength({ min: 2, max: 100 }).withMessage("Genre must be between 2 and 100 characters"),
  
  body("publishedYear")
    .notEmpty().withMessage("Published year is required")
    .isInt({ min: 1000, max: 2030 }).withMessage("Published year must be a valid integer between 1000 and 2030"),
  
  body("authorId")
    .notEmpty().withMessage("Author ID is required")
    .isInt({ min: 1 }).withMessage("Author ID must be a positive integer"),
  
  body("available")
    .optional()
    .isBoolean().withMessage("Available must be a boolean value (true/false)"),
  
  validate
];

// 5. Review Creation Validation Schema
const validateReview = [
  param("id")
    .isInt({ min: 1 }).withMessage("Book ID must be a positive integer"),
  
  body("rating")
    .notEmpty().withMessage("Rating is required")
    .isInt({ min: 1, max: 5 }).withMessage("Rating must be an integer between 1 and 5"),
  
  body("comment")
    .trim()
    .notEmpty().withMessage("Comment is required")
    .isLength({ min: 3, max: 1000 }).withMessage("Comment must be between 3 and 1000 characters"),
  
  validate
];

// 6. Route Parameter ID Validation Schema
const validateIdParam = [
  param("id")
    .isInt({ min: 1 }).withMessage("ID parameter must be a positive integer"),
  
  validate
];

// 7. Query Parameters Validation Schema (Pagination, Filtering, Sorting)
const validateBookQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage("Limit must be an integer between 1 and 100"),
  
  query("sortBy")
    .optional()
    .isIn(["id", "title", "publishedYear", "createdAt"]).withMessage("sortBy must be one of: id, title, publishedYear, createdAt"),
  
  query("sortOrder")
    .optional()
    .isIn(["ASC", "DESC", "asc", "desc"]).withMessage("sortOrder must be ASC or DESC"),
  
  validate
];

module.exports = {
  validateSignup,
  validateLogin,
  validateAuthor,
  validateBook,
  validateReview,
  validateIdParam,
  validateBookQuery
};

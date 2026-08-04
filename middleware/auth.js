const jwt = require("jsonwebtoken");

/**
 * Authentication Middleware
 * Validates JWT Token from Authorization header: 'Authorization: Bearer <token>'
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  
  // Format: Bearer TOKEN
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No authorization token provided."
    });
  }

  try {
    // Verify token using secret key (with fallback)
    const secretKey = process.env.JWT_SECRET || "super_secret_jwt_key_health_check_api_2026";
    const decoded = jwt.verify(token, secretKey);
    
    // Attach decoded user info to request object
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again."
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid authorization token."
    });
  }
};

module.exports = authenticateToken;

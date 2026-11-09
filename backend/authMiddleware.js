const jwt = require("jsonwebtoken");

// Must be the SAME value authService.js uses to sign tokens (both read .env)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set in .env (at least 32 characters)");
}

// Verifies the "Authorization: Bearer <token>" header and puts the token's
// payload on req.user (for example { userId, username }).
function authenticateToken(req, res, next) {
  const header = req.headers["authorization"] || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      error: "Authentication required.",
      code: "TOKEN_MISSING",
    });
  }

  try {
    // Only accept the algorithm we sign with
    req.user = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    return next();
  } catch (error) {
    const expired = error.name === "TokenExpiredError";
    return res.status(401).json({
      success: false,
      error: expired
        ? "Session expired. Please log in again."
        : "Invalid session. Please log in again.",
      code: expired ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
    });
  }
}

module.exports = authenticateToken;

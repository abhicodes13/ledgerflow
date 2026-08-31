const jwt = require("jsonwebtoken");
const JWT_SECRET = "LEDGERFLOW_MASTER_SECURE_TOKEN_SALT_999";

// 🚨 THE SECURITY GUARDMIDDLEWARE: Decodes incoming network passport keys
function authenticateToken(req, res, next) {
  // Extract the Authorization header capsule from the incoming flight request
  const authHeader = req.headers["authorization"];

  // Header format is traditionally: "Bearer TOKEN_STRING"
  const token = authHeader && authHeader.split(" ")[1];

  // If the token string is completely missing, lock the door immediately
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access Denied: Missing digital token session passport.",
    });
  }

  try {
    // Crack open and verify the cryptographic signature using your secret salt
    const verifiedPayload = jwt.verify(token, JWT_SECRET);

    // ⚡ THE ARCHITECTURE CRUX: Inject the decrypted userId straight into the request object!
    req.user = verifiedPayload;

    // Passport verified! Wave them through the security gate to the next route function
    next();
  } catch (error) {
    console.error("❌ JWT Verification Security Breach:", error.message);
    return res.status(403).json({
      success: false,
      error: "Access Forbidden: Session token is expired or tampered with.",
    });
  }
}

module.exports = authenticateToken;

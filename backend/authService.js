const pool = require("./db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const RESET_TTL_MINUTES = 30;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set in .env (at least 32 characters)");
}

// Errors we deliberately show to users; anything else becomes a generic 500
class AuthError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;
// Compared against when the username doesn't exist, so timing doesn't reveal it
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);
function validatePassword(password) {
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password) > 72
  ) {
    throw new AuthError("Password must be 8 to 72 characters");
  }
}
const authService = {
  AuthError,

  async register(username, email, password) {
    const cleanUser = typeof username === "string" ? username.trim() : "";
    const cleanEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (cleanUser.length < 3 || cleanUser.length > 100) {
      throw new AuthError("Username must be 3 to 100 characters");
    }
    if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 255) {
      throw new AuthError("A valid email is required");
    }
    if (
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password) > 72
    ) {
      throw new AuthError("Password must be 8 to 72 characters");
    }

    const passwordHash = await bcrypt.hash(password, 10); // note: password NOT trimmed

    try {
      const result = await pool.query(
        `INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, username, email, created_at;`,
        [cleanUser, cleanEmail, passwordHash],
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === "23505") {
        // Same message for username or email, so emails can't be probed
        throw new AuthError("That username or email is already in use", 409);
      }
      throw error;
    }
  },

  async login(username, password) {
    if (typeof username !== "string" || typeof password !== "string") {
      throw new AuthError("Invalid username or password", 401);
    }

    const result = await pool.query(
      "SELECT id, username, email, password_hash FROM users WHERE username = $1;",
      [username.trim()],
    );
    const user = result.rows[0];

    const isMatch = await bcrypt.compare(
      password,
      user ? user.password_hash : DUMMY_HASH,
    );
    if (!user || !isMatch) {
      throw new AuthError("Invalid username or password", 401);
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h", algorithm: "HS256" },
    );

    return {
      token,
      user: { id: user.id, username: user.username, email: user.email },
    };
  },
  // Returns { email, username, token } if the account exists, otherwise null.
  async createPasswordReset(email) {
    const cleanEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 255) return null;

    const { rows } = await pool.query(
      "SELECT id, username, email FROM users WHERE email = $1",
      [cleanEmail],
    );
    const user = rows[0];
    if (!user) return null;

    const token = crypto.randomBytes(32).toString("hex");
    await pool.query(
      "UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL",
      [user.id],
    );
    await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + make_interval(mins => $3))`,
      [user.id, sha256(token), RESET_TTL_MINUTES],
    );
    return { email: user.email, username: user.username, token };
  },

  async resetPassword(token, newPassword) {
    if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) {
      throw new AuthError("This reset link is invalid or has expired.");
    }
    validatePassword(newPassword);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Claim the token and change the password together, or neither happens
      const claimed = await client.query(
        `UPDATE password_resets SET used_at = now()
         WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
         RETURNING user_id`,
        [sha256(token)],
      );
      if (claimed.rowCount === 0) {
        throw new AuthError("This reset link is invalid or has expired.");
      }
      const userId = claimed.rows[0].user_id;
      await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
        passwordHash,
        userId,
      ]);
      await client.query(
        "UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL",
        [userId],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },
};

module.exports = authService;

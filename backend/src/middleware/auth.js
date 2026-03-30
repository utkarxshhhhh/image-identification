const jwt = require("jsonwebtoken");

/**
 * Express middleware that verifies a JWT access token from the
 * Authorization header (Bearer scheme).  Attaches the decoded
 * payload to req.user on success.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized – no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Not authorized – invalid token" });
  }
};

module.exports = { protect };

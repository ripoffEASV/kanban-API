const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.cookies["auth-token"];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

const verifyUserHasUpdatePrivilege = (req, res, next) => {
  try {
    const token = req.cookies['auth-token'];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Verify the token and decode it
    const decoded = jwt.verify(token, process.env.SECRET);

    const userId = decoded.id;

    if (userId !== req.body.createdByID && userId !== req.body.ownerID) {
      return res.status(403).json({ message: "Forbidden, you do not have the right permission to do this action"});
    }

    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
}

module.exports = { verifyToken, verifyUserHasUpdatePrivilege };

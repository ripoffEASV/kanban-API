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

  // const token = req.headers["authorization"];
  // console.log(token);
  // if (!token || typeof token === "undefined") {
  //   return res.status(401).json({ error: "Access denied!" });
  // }

  // try {
  //   const verified = jwt.verify(token, process.env.SECRET);
  //   req.user = verified;
  //   console.log("user verified");
  //   next();
  // } catch (err) {
  //   res.status(400).json({ error: err });
  // }
};

module.exports = verifyToken;

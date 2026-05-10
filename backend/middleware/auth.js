const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Token nikalo
      token = req.headers.authorization.split(' ')[1];

      // Verify karo
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // User id request mein daalo
      req.user = decoded;

      next();
    } catch (error) {
      res.status(401).json({ message: 'Token galat hai, login karo' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Token nahi mila, login karo' });
  }
};

module.exports = protect;
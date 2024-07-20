// middleware/auth.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/UserSchema'); // Ensure you import the User model

module.exports = async function(req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the token has expired
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    if (decoded.exp < currentTime) {
      return res.status(401).json({ msg: 'Token has expired' });
    }

    // Attach the user to the request object
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ msg: 'User not found' });
    }
    req.user = user;

    // Check if user is an admin
    if (user.role === 'admin') {
      req.isAdmin = true;
    } else {
      req.isAdmin = false;
    }

    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

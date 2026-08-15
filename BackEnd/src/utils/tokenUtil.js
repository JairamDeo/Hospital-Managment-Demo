import jwt from 'jsonwebtoken';

export const generateToken = (userId, payload = {}) => {
  return jwt.sign({ id: userId, ...payload }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

// Function to verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null; // Invalid or expired token
  }
};

export default { generateToken , verifyToken}
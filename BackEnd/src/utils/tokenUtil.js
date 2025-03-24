import jwt from 'jsonwebtoken';

// Function to generate JWT token
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN, // 1 hour expiration
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
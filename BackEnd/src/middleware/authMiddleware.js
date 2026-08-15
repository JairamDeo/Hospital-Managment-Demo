import {verifyToken} from '../utils/tokenUtil.js';
import { logger } from '../utils/logger.js';

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Bearer token format
  if (!token) {
    logger.error('Access denied or No token');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    logger.error('Invalid or expired token');
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
  logger.info(`Token Provied`);
  req.user = decoded;  // Attach decoded user data (id) to the request object
  next();
};

export default authenticateToken;

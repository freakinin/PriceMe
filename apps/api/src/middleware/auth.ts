import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      return next();
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication failed',
    });
  }
};


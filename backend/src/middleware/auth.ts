import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

// ---- Types ----
export interface UserPayload {
  userId: number;
  username: string;
}

// ขยาย Request type ให้รู้จัก user
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

// ---- REST API Middleware ----
// ใช้กับ app.get('/messages/:roomId', authMiddleware, handler)
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization; // "Bearer <token>"
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ---- Socket.IO Middleware ----
// ใช้กับ io.use(socketAuthMiddleware)
// Client ต้องส่ง { auth: { token: "..." } } ตอน io("url", { auth: {...} })
export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: ExtendedError) => void
): void {
  const token = socket.handshake.auth.token as string;

  if (!token) {
    next(new Error('Authentication error: No token provided'));
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    // ฝัง user ลงใน socket.data เพื่อใช้ใน event handlers
    socket.data.user = decoded;
    next();
  } catch {
    next(new Error('Authentication error: Invalid or expired token'));
  }
}

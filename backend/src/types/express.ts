import { Request } from 'express';
import { JwtPayload } from './index';

declare global {
  namespace Express {
    interface User extends JwtPayload {
      id: string;
    }
  }
}

export type AuthRequest = Request;

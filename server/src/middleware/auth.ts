import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
}
export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: "Access token is missing" });
      return;
    }

    jwt.verify(token, env.jwtSecret, (err, user) => {
      if (err) {
        res.status(403).json({ error: "Invalid or expired token" });
        return;
      }

      req.user = user as { id: string; email: string; isAdmin: boolean };
      next();
    });
  } else {
    res.status(401).json({ error: "Authorization header is required" });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: "Access restricted to administrators only" });
  }
}

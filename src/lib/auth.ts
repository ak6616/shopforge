import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export function authenticateRequest(req: NextRequest): JwtPayload {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw new AuthError("Missing authorization token");
  }
  try {
    return verifyAccessToken(token);
  } catch {
    throw new AuthError("Invalid or expired token");
  }
}

export function requireAdmin(req: NextRequest): JwtPayload {
  const payload = authenticateRequest(req);
  if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") {
    throw new AuthError("Admin access required");
  }
  return payload;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

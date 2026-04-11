import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";

export interface AdminTokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Sign a JWT for admin session
 */
export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verify and decode an admin JWT
 */
export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
  } catch {
    return null;
  }
}

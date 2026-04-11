import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, type AdminTokenPayload } from "./jwt";

const ADMIN_COOKIE = "admin_token";

/**
 * Get admin session from cookies (server-side)
 */
export async function getAdminSession(): Promise<AdminTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/**
 * Middleware helper: verify admin auth for API routes
 * Returns the admin payload or a 401 response
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ admin: AdminTokenPayload } | { error: NextResponse }> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;

  if (!token) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const admin = verifyAdminToken(token);
  if (!admin) {
    return {
      error: NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }),
    };
  }

  return { admin };
}

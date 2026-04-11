import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const admin = verifyAdminToken(token);
  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  });
}

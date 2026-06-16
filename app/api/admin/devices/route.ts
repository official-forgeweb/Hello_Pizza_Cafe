import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/jwt";

function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return false;
  return verifyAdminToken(token) !== null;
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const devices = await prisma.device.findMany({
      orderBy: { lastSeenAt: "desc" },
    });
    return NextResponse.json(devices);
  } catch (error: any) {
    console.error("Error in GET devices:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 });
    }

    await prisma.device.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Device unregistered successfully" });
  } catch (error: any) {
    console.error("Error in DELETE device:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

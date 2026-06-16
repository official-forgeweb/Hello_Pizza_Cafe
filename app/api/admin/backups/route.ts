import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/jwt";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kxyaypvmgekxkwtkqnju.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");

    if (id && action === "download") {
      const backup = await prisma.dbBackup.findUnique({
        where: { id },
      });
      if (!backup) {
        return NextResponse.json({ error: "Backup not found" }, { status: 404 });
      }

      // Download from Supabase Storage
      const { data, error } = await supabase.storage
        .from("db-backups")
        .download(backup.storagePath);

      if (error || !data) {
        console.error("Supabase storage download error:", error);
        return NextResponse.json({ error: error?.message || "Failed to download file from cloud storage" }, { status: 500 });
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${backup.fileName}"`,
        },
      });
    }

    const backups = await prisma.dbBackup.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        device: {
          select: {
            deviceName: true,
          },
        },
      },
    });

    // Format BigInt to string for JSON serialization
    const formatted = backups.map(b => ({
      ...b,
      fileSize: b.fileSize.toString(),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Error in GET backups:", error);
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
      return NextResponse.json({ error: "Backup ID is required" }, { status: 400 });
    }

    const backup = await prisma.dbBackup.findUnique({
      where: { id },
    });

    if (!backup) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    // Delete from Supabase Storage
    await supabase.storage.from("db-backups").remove([backup.storagePath]);

    // Delete from database
    await prisma.dbBackup.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Backup deleted successfully" });
  } catch (error: any) {
    console.error("Error in DELETE backup:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

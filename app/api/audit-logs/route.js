import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";
import {
  getAuthenticatedUser,
  isAdmin,
} from "../../../lib/auth";

export async function GET(request) {
  try {
    const currentUser = await getAuthenticatedUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    if (!isAdmin(currentUser)) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const database = await getDatabase();
    const auditLogs = database.collection("audit_logs");

    const logs = await auditLogs
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      message: "Audit logs retrieved successfully",
      data: logs,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to retrieve audit logs",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
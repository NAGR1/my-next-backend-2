import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb";
import {
  getAuthenticatedUser,
  isAdmin,
} from "../../../../lib/auth";
import { recordAudit } from "../../../../lib/audit";

export async function PUT(request) {
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

    const { userId, newPassword } = await request.json();

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { message: "Invalid user ID" },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { message: "New password must contain at least 6 characters" },
        { status: 400 }
      );
    }

    const database = await getDatabase();
    const users = database.collection("users");

    const targetUser = await users.findOne({
      _id: new ObjectId(userId),
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await users.updateOne(
      { _id: targetUser._id },
      {
        $set: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
        },
      }
    );

    await recordAudit({
      user: currentUser,
      action: "CHANGE_USER_PASSWORD",
      details: {
        targetUserId: targetUser._id.toString(),
        targetUsername: targetUser.username,
      },
    });

    return NextResponse.json({
      message: `Password for ${targetUser.username} changed successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to change password",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
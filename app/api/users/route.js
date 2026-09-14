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
    const users = database.collection("users");

    const userList = await users
      .find({})
      .project({
        password: 0,
      })
      .toArray();

    return NextResponse.json({
      message: "Users retrieved successfully",
      data: userList,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to retrieve users",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
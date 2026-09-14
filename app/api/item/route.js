import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";
import { getAuthenticatedUser } from "../../../lib/auth";
import { recordAudit } from "../../../lib/audit";

export async function GET(request) {
  try {
    const currentUser = await getAuthenticatedUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const database = await getDatabase();
    const collection = database.collection("listings");

    const items = await collection
      .find({ status: { $ne: "DELETED" } })
      .toArray();

    await recordAudit({
      user: currentUser,
      action: "VIEW_ITEMS",
      details: {
        numberOfItems: items.length,
      },
    });

    return NextResponse.json({
      message: "Items retrieved successfully",
      data: items,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to retrieve items",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const currentUser = await getAuthenticatedUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const requestData = await request.json();

    if (!requestData.title || requestData.price === undefined) {
      return NextResponse.json(
        { message: "Title and price are required" },
        { status: 400 }
      );
    }

    const newItem = {
      title: requestData.title,
      description: requestData.description || "",
      price: Number(requestData.price),
      location: requestData.location || "",
      status: "ACTIVE",
      createdBy: currentUser.username,
      createdAt: new Date(),
    };

    const database = await getDatabase();
    const collection = database.collection("listings");

    const result = await collection.insertOne(newItem);

    await recordAudit({
      user: currentUser,
      action: "CREATE_ITEM",
      itemId: result.insertedId.toString(),
      details: {
        title: newItem.title,
      },
    });

    return NextResponse.json(
      {
        message: "Item created successfully",
        insertedId: result.insertedId,
        data: newItem,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to create item",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
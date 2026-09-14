import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb";
import { getAuthenticatedUser } from "../../../../lib/auth";
import { recordAudit } from "../../../../lib/audit";

export async function PUT(request, { params }) {
  try {
    const currentUser = await getAuthenticatedUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid item ID" },
        { status: 400 }
      );
    }

    const requestData = await request.json();

    const updatedData = {
      title: requestData.title,
      description: requestData.description || "",
      price: Number(requestData.price),
      location: requestData.location || "",
      updatedBy: currentUser.username,
      updatedAt: new Date(),
    };

    const database = await getDatabase();
    const collection = database.collection("listings");

    const result = await collection.updateOne(
      {
        _id: new ObjectId(id),
        status: { $ne: "DELETED" },
      },
      {
        $set: updatedData,
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Active item not found" },
        { status: 404 }
      );
    }

    await recordAudit({
      user: currentUser,
      action: "UPDATE_ITEM",
      itemId: id,
      details: {
        title: updatedData.title,
      },
    });

    return NextResponse.json({
      message: "Item updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to update item",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const currentUser = await getAuthenticatedUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid item ID" },
        { status: 400 }
      );
    }

    const database = await getDatabase();
    const collection = database.collection("listings");

    const item = await collection.findOne({
      _id: new ObjectId(id),
      status: { $ne: "DELETED" },
    });

    if (!item) {
      return NextResponse.json(
        { message: "Active item not found" },
        { status: 404 }
      );
    }

    await collection.updateOne(
      { _id: item._id },
      {
        $set: {
          status: "DELETED",
          deletedBy: currentUser.username,
          deletedAt: new Date(),
        },
      }
    );

    await recordAudit({
      user: currentUser,
      action: "DELETE_ITEM",
      itemId: id,
      details: {
        title: item.title,
      },
    });

    return NextResponse.json({
      message: "Item soft-deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to delete item",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
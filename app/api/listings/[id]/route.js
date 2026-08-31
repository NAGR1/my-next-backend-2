import { MongoClient, ObjectId } from "mongodb";

export async function PUT(request, { params }) {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return Response.json(
        { message: "Invalid item ID" },
        { status: 400 }
      );
    }

    const requestData = await request.json();
    const { _id, status, ...updatedData } = requestData;

    await client.connect();

    const database = client.db("nextjs_database");
    const collection = database.collection("listings");

    const result = await collection.updateOne(
      {
        _id: new ObjectId(id),
        status: { $ne: "DELETED" },
      },
      {
        $set: {
          ...updatedData,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return Response.json(
        { message: "Active item not found" },
        { status: 404 }
      );
    }

    return Response.json({
      message: "Listing updated successfully",
    });
  } catch (error) {
    return Response.json(
      {
        message: "Failed to update listing",
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

export async function DELETE(request, { params }) {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return Response.json(
        { message: "Invalid item ID" },
        { status: 400 }
      );
    }

    await client.connect();

    const database = client.db("nextjs_database");
    const collection = database.collection("listings");

    // Soft delete: update status instead of removing the document
    const result = await collection.updateOne(
      {
        _id: new ObjectId(id),
        status: { $ne: "DELETED" },
      },
      {
        $set: {
          status: "DELETED",
          deletedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return Response.json(
        { message: "Active item not found" },
        { status: 404 }
      );
    }

    return Response.json({
      message: "Listing soft-deleted successfully",
    });
  } catch (error) {
    return Response.json(
      {
        message: "Failed to delete listing",
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
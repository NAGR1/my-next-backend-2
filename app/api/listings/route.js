import { MongoClient } from "mongodb";

export async function GET() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();

    const database = client.db("nextjs_database");
    const collection = database.collection("listings");

    const listings = await collection
      .find({ status: { $ne: "DELETED" } })
      .toArray();

    return Response.json({
      message: "Listings retrieved successfully",
      data: listings,
    });
  } catch (error) {
    return Response.json(
      {
        message: "Failed to retrieve listings",
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

export async function POST(request) {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    const requestData = await request.json();

    const newListing = {
      ...requestData,
      status: "ACTIVE",
      createdAt: new Date(),
    };

    await client.connect();

    const database = client.db("nextjs_database");
    const collection = database.collection("listings");

    const result = await collection.insertOne(newListing);

    return Response.json(
      {
        message: "Listing created successfully",
        insertedId: result.insertedId,
        data: newListing,
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      {
        message: "Failed to create listing",
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
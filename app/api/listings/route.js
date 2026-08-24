import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);

export async function GET() {
  try {
    const database = client.db("nextjs_database");
    const collection = database.collection("listings");

    const listings = await collection.find({}).toArray();

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
  }
}

export async function POST(request) {
  try {
    const listing = await request.json();

    const database = client.db("nextjs_database");
    const collection = database.collection("listings");

    const result = await collection.insertOne(listing);

    return Response.json(
      {
        message: "Listing created successfully",
        insertedId: result.insertedId,
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
  }
}

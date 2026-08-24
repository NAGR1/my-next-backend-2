export async function GET() {
  return Response.json(
    {
      message: "hello world",
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:5174",
      },
    }
  );
}
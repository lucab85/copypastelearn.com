import { NextResponse } from "next/server";

/**
 * IndexNow key verification endpoint.
 * Responds to GET /{INDEXNOW_KEY}.txt with the key as plain text.
 * @see https://www.indexnow.org/documentation
 */
export async function GET() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return NextResponse.json({ error: "Not configured" }, { status: 404 });
  }
  return new NextResponse(key, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

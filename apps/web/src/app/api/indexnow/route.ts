import { NextRequest, NextResponse } from "next/server";

const INDEXNOW_KEY = "b5172a02aa0d692ca274f281147617c8";
const HOST = "www.copypastelearn.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.INDEXNOW_SECRET;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const urls: string[] = Array.isArray(body.urls) ? body.urls : body.url ? [body.url] : [];

    if (urls.length === 0) {
      return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
    }

    const fullUrls = urls.map((u) =>
      u.startsWith("http") ? u : `https://${HOST}${u.startsWith("/") ? u : `/${u}`}`
    );

    const payload = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
      urlList: fullUrls,
    };

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({
      success: true,
      submitted: fullUrls.length,
      status: response.status,
      urls: fullUrls,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "IndexNow",
    key: INDEXNOW_KEY,
    endpoint: INDEXNOW_ENDPOINT,
    usage: "POST /api/indexnow with Authorization: Bearer <INDEXNOW_SECRET> and body: { urls: [\"/blog/my-post\"] }",
  });
}

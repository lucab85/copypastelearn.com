import { NextResponse, type NextRequest } from "next/server";
import { generateMuxTokens } from "@/lib/mux";
import { withErrorHandling, requireAuth } from "../../../_lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ playbackId: string }> }
) {
  return withErrorHandling(async () => {
    await requireAuth();
    const { playbackId } = await params;

    const tokens = generateMuxTokens(playbackId);
    if (!tokens) {
      // Public playback — no signing required
      return NextResponse.json({
        success: true,
        data: { signed: false, playbackId },
      });
    }

    return NextResponse.json({
      success: true,
      data: { signed: true, playbackId, ...tokens },
    });
  });
}

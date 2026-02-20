import { NextResponse } from "next/server";
import { createPortalSession } from "@/server/actions/billing";

export async function GET() {
  try {
    const { url } = await createPortalSession();
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Failed to create portal session:", error);
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";
    return NextResponse.redirect(`${appUrl}/settings?error=billing`);
  }
}

import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface ClerkUserEventData {
  id: string;
  email_addresses: { email_address: string; id: string }[];
  first_name: string | null;
  last_name: string | null;
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Validate the webhook signature using svix
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let event: { type: string; data: ClerkUserEventData };

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event;
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  const { type, data } = event;

  try {
    switch (type) {
      case "user.created": {
        const email = data.email_addresses[0]?.email_address ?? "";
        const displayName = [data.first_name, data.last_name]
          .filter(Boolean)
          .join(" ") || null;

        await db.user.create({
          data: {
            clerkUserId: data.id,
            email,
            displayName,
          },
        });
        break;
      }

      case "user.updated": {
        const email = data.email_addresses[0]?.email_address ?? "";
        const displayName = [data.first_name, data.last_name]
          .filter(Boolean)
          .join(" ") || null;

        await db.user.update({
          where: { clerkUserId: data.id },
          data: { email, displayName },
        });
        break;
      }

      case "user.deleted": {
        // Cascade delete handles related records
        await db.user.delete({
          where: { clerkUserId: data.id },
        });
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }
  } catch (error) {
    console.error(`Error handling Clerk webhook event ${type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

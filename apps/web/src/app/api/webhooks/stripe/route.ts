import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkUserId = session.metadata?.clerkUserId;

        if (!clerkUserId || !session.subscription) break;

        const user = await db.user.findUnique({
          where: { clerkUserId },
        });

        if (!user) {
          console.error(
            `User not found for clerkUserId: ${clerkUserId}`
          );
          break;
        }

        // Retrieve the subscription to get period dates
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await db.subscription.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            clerkSubscriptionId: subscription.id,
            planId: "pro-monthly",
            status: "ACTIVE",
            currentPeriodStart: new Date(
              subscription.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
          },
          update: {
            clerkSubscriptionId: subscription.id,
            status: "ACTIVE",
            currentPeriodStart: new Date(
              subscription.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const existingSub = await db.subscription.findUnique({
          where: { clerkSubscriptionId: subscription.id },
        });

        if (!existingSub) break;

        const statusMap: Record<string, string> = {
          active: "ACTIVE",
          canceled: "CANCELED",
          past_due: "PAST_DUE",
          unpaid: "PAST_DUE",
        };

        await db.subscription.update({
          where: { clerkSubscriptionId: subscription.id },
          data: {
            status: (statusMap[subscription.status] ?? "ACTIVE") as
              | "ACTIVE"
              | "CANCELED"
              | "EXPIRED"
              | "PAST_DUE",
            currentPeriodStart: new Date(
              subscription.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
            canceledAt: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000)
              : null,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await db.subscription.updateMany({
          where: { clerkSubscriptionId: subscription.id },
          data: {
            status: "EXPIRED",
            canceledAt: new Date(),
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string | null;

        if (!subscriptionId) break;

        await db.subscription.updateMany({
          where: { clerkSubscriptionId: subscriptionId },
          data: { status: "PAST_DUE" },
        });
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }
  } catch (error) {
    console.error(`Error handling Stripe webhook event ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-01-28.clover",
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

        // Retrieve the subscription (with items) to get period dates
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
          { expand: ["items"] }
        );

        // In Stripe SDK v20+, period dates live on SubscriptionItem
        const item = subscription.items.data[0];
        const periodStart = item?.current_period_start
          ? new Date(item.current_period_start * 1000)
          : new Date();
        const periodEnd = item?.current_period_end
          ? new Date(item.current_period_end * 1000)
          : new Date();

        await db.subscription.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            clerkSubscriptionId: subscription.id,
            planId: "pro-monthly",
            status: "ACTIVE",
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
          update: {
            clerkSubscriptionId: subscription.id,
            status: "ACTIVE",
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
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

        // In Stripe SDK v20+, period dates live on SubscriptionItem
        const subItem = subscription.items.data[0];
        const subPeriodStart = subItem?.current_period_start
          ? new Date(subItem.current_period_start * 1000)
          : existingSub.currentPeriodStart;
        const subPeriodEnd = subItem?.current_period_end
          ? new Date(subItem.current_period_end * 1000)
          : existingSub.currentPeriodEnd;

        await db.subscription.update({
          where: { clerkSubscriptionId: subscription.id },
          data: {
            status: (statusMap[subscription.status] ?? "ACTIVE") as
              | "ACTIVE"
              | "CANCELED"
              | "EXPIRED"
              | "PAST_DUE",
            currentPeriodStart: subPeriodStart,
            currentPeriodEnd: subPeriodEnd,
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
        // In Stripe SDK v20+, subscription moved to invoice.parent.subscription_details
        const parentSub = invoice.parent?.subscription_details?.subscription;
        const subscriptionId =
          typeof parentSub === "string"
            ? parentSub
            : parentSub?.id ?? null;

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

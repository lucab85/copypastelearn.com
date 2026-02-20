import { requireAuth } from "@/lib/auth";
import { getSubscriptionStatus } from "@/lib/billing";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/checkout-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { CreditCard, User, Shield } from "lucide-react";

export const metadata = {
  title: "Account Settings",
};

export default async function SettingsPage() {
  const user = await requireAuth();
  const subscription = await getSubscriptionStatus();

  const statusBadgeVariant =
    subscription?.status === "ACTIVE"
      ? "default"
      : subscription?.status === "PAST_DUE"
        ? "destructive"
        : "secondary";

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Account Settings</h1>

      {/* Account Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium">{user.displayName ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Role</span>
            <Badge variant="outline">{user.role}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={statusBadgeVariant}>
              {subscription?.status ?? "No subscription"}
            </Badge>
          </div>

          {subscription?.currentPeriodEnd && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                {subscription.cancelAtPeriodEnd
                  ? "Access until"
                  : "Renews on"}
              </span>
              <span className="text-sm font-medium">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "long", year: "numeric" }
                )}
              </span>
            </div>
          )}

          {subscription?.cancelAtPeriodEnd && (
            <p className="text-sm text-orange-600 dark:text-orange-400">
              Your subscription will not renew after the current period.
            </p>
          )}

          <Separator />

          {subscription?.isSubscribed ? (
            <div className="space-y-2">
              {/* Clerk Billing portal link */}
              <Button variant="outline" className="w-full" asChild>
                <a href="/api/billing/portal" target="_blank" rel="noopener">
                  Manage Billing
                </a>
              </Button>
              {!subscription.cancelAtPeriodEnd && (
                <p className="text-center text-xs text-muted-foreground">
                  Cancel or update payment method via the billing portal
                </p>
              )}
            </div>
          ) : (
            <CheckoutButton className="w-full">
              Subscribe — €29/month
            </CheckoutButton>
          )}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Password, two-factor authentication, and connected accounts are
            managed through Clerk.
          </p>
          <Button variant="outline" size="sm" className="mt-3" asChild>
            <a
              href="https://accounts.clerk.dev/user"
              target="_blank"
              rel="noopener"
            >
              Manage Security Settings
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

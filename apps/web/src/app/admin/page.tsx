import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Terminal, CreditCard } from "lucide-react";

export const metadata = { title: "Admin Overview" };

export default async function AdminPage() {
  const [courseCount, userCount, activeLabCount, subscriberCount] =
    await Promise.all([
      db.course.count(),
      db.user.count(),
      db.labSession.count({
        where: {
          status: { in: ["PROVISIONING", "READY", "RUNNING", "VALIDATING"] },
        },
      }),
      db.subscription.count({ where: { status: "ACTIVE" } }),
    ]);

  const stats = [
    { label: "Courses", value: courseCount, icon: BookOpen },
    { label: "Users", value: userCount, icon: Users },
    { label: "Active Labs", value: activeLabCount, icon: Terminal },
    { label: "Subscribers", value: subscriberCount, icon: CreditCard },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

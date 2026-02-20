import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings, BookOpen, Terminal, LayoutDashboard } from "lucide-react";

export const metadata = {
  title: {
    template: "%s | Admin",
    default: "Admin",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will throw ForbiddenError for non-admins
  await requireAdmin();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r bg-muted/30">
        <div className="p-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Settings className="h-5 w-5" />
            Admin
          </h2>
        </div>
        <nav className="space-y-1 px-2">
          <NavItem href="/admin" icon={LayoutDashboard} label="Overview" />
          <NavItem href="/admin/courses" icon={BookOpen} label="Courses" />
          <NavItem href="/admin/labs" icon={Terminal} label="Lab Sessions" />
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

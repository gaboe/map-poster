import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/shared/layout/app-layout";
import { Link } from "@tanstack/react-router";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Users, Database, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/admin/")({
  component: RouteComponent,
});

type AdminSection = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
};

const adminSections: AdminSection[] = [
  {
    title: "User Management",
    description:
      "Manage users, roles, and permissions across the platform",
    icon: Users,
    href: "/app/admin/users",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    title: "Database Observability",
    description:
      "Real-time database performance analysis and optimization insights",
    icon: Database,
    href: "/app/admin/observability",
    color: "text-orange-600 dark:text-orange-400",
  },
];

function RouteComponent() {
  return (
    <AppLayout title="Admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage platform settings, users, and system
            health
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminSections.map((section) => (
            <Link
              key={section.href}
              to={section.href}
              className="group"
            >
              <Card className="transition-colors hover:bg-muted/20 hover:ring-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg bg-muted ${section.color}`}
                      >
                        <section.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {section.title}
                        </CardTitle>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1 transition-transform" />
                  </div>
                  <CardDescription className="mt-2">
                    {section.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

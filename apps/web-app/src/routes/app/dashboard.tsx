import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/shared/layout/app-layout";
import { Button } from "@/shared/ui/button";
import {
  useSuspenseQuery,
  useMutation,
} from "@tanstack/react-query";
import { useTRPC } from "@/infrastructure/trpc/react";
import { StatCard } from "@/shared/ui/stat-card";
import { ResponsiveCard } from "@/shared/ui/responsive-card";
import {
  IconBug,
  IconDatabase,
  IconUsers,
  IconMap,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useUserInfo } from "@/hooks/users/use-user-info";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/dashboard")({
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.admin.osmData.list.queryOptions()
    );
    void context.queryClient.prefetchQuery(
      context.trpc.admin.getUserStats.queryOptions()
    );
    return {};
  },
  component: DashboardPage,
});

function DashboardPage() {
  const trpc = useTRPC();
  const { data: user } = useUserInfo();
  const isAdmin = user?.role === "admin";

  const {
    mutate: testBackendError,
    isPending: isTestingBackend,
  } = useMutation(
    trpc.testing.throwTestError.mutationOptions({
      onError: () => {
        toast.error("Backend error was sent to Sentry");
      },
    })
  );

  const handleFrontendError = () => {
    toast.error("Frontend error was sent to Sentry");
    throw new Error("Test Sentry Frontend Error");
  };

  return (
    <AppLayout
      title="Dashboard"
      description="Map Poster Admin Dashboard"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 xl:py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Vítejte v Map Poster
          </h1>
          <p className="text-muted-foreground mt-1">
            Správa mapových podkladů a uživatelů
          </p>
        </div>

        {isAdmin && <AdminDashboard />}

        <ResponsiveCard padding="md" className="mt-6">
          <h2 className="text-lg font-semibold mb-4">
            Sentry Test
          </h2>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleFrontendError}
            >
              <IconBug className="size-4 mr-2" />
              Test Frontend Error
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => testBackendError()}
              disabled={isTestingBackend}
            >
              <IconBug className="size-4 mr-2" />
              Test Backend Error
            </Button>
          </div>
        </ResponsiveCard>
      </div>
    </AppLayout>
  );
}

function AdminDashboard() {
  const trpc = useTRPC();

  const { data: osmDataSources = [] } = useSuspenseQuery(
    trpc.admin.osmData.list.queryOptions()
  );

  const { data: userStats } = useSuspenseQuery(
    trpc.admin.getUserStats.queryOptions()
  );

  const completedSources = osmDataSources.filter(
    (s) => s.status === "completed"
  );
  const pendingSources = osmDataSources.filter(
    (s) =>
      s.status === "pending" ||
      s.status === "downloading" ||
      s.status === "converting" ||
      s.status === "importing"
  );

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 xl:gap-4 mb-6">
        <StatCard
          label="Celkem uživatelů"
          value={userStats?.totalUsers ?? 0}
        />
        <StatCard
          label="Admin uživatelů"
          value={userStats?.adminUsersCount ?? 0}
        />
        <StatCard
          label="Aktivní (24h)"
          value={userStats?.activeUsersLast24h ?? 0}
        />
        <StatCard
          label="OSM importy"
          value={completedSources.length}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xl:gap-6">
        <ResponsiveCard padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <IconDatabase className="size-5" />
              OSM Data Status
            </h2>
            <Link to="/app/admin/osm-data">
              <Button variant="outline" size="sm">
                Spravovat
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {osmDataSources.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Žádné OSM zdroje
              </p>
            ) : (
              osmDataSources.slice(0, 5).map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <IconMap className="size-4 text-muted-foreground" />
                    <span className="font-medium">
                      {source.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({source.code})
                    </span>
                  </div>
                  <StatusBadge status={source.status} />
                </div>
              ))
            )}
          </div>

          {pendingSources.length > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              {pendingSources.length} zdrojů čeká na import
            </p>
          )}
        </ResponsiveCard>

        <ResponsiveCard padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <IconUsers className="size-5" />
              Uživatelé
            </h2>
            <Link to="/app/admin/users">
              <Button variant="outline" size="sm">
                Spravovat
              </Button>
            </Link>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Celkem uživatelů
              </span>
              <span className="font-medium">
                {userStats?.totalUsers ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Administrátoři
              </span>
              <span className="font-medium">
                {userStats?.adminUsersCount ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Aktivní za 24h
              </span>
              <span className="font-medium">
                {userStats?.activeUsersLast24h ?? 0}
              </span>
            </div>
          </div>
        </ResponsiveCard>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    importing:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    downloading:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    converting:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    failed:
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded ${colors[status] ?? "bg-gray-100 text-gray-800"}`}
    >
      {status}
    </span>
  );
}

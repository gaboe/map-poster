import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/shared/layout/app-layout";
import { useTRPC } from "@/infrastructure/trpc/react";
import {
  useSuspenseQuery,
  useMutation,
} from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import {
  CircleCheck,
  CircleX,
  CloudDownload,
  Loader,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/app/admin/osm-data")(
  {
    component: RouteComponent,
    loader: async ({ context }) => {
      await context.queryClient.prefetchQuery(
        context.trpc.admin.osmData.list.queryOptions()
      );
    },
  }
);

type StatusKey =
  | "pending"
  | "downloading"
  | "converting"
  | "importing"
  | "completed"
  | "failed";

const ACTIVE_STATUSES = new Set<StatusKey>([
  "downloading",
  "converting",
  "importing",
]);

function RouteComponent() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery({
    ...trpc.admin.osmData.list.queryOptions(),
    refetchInterval: 5000,
  });

  const startImport = useMutation(
    trpc.admin.osmData.startImport.mutationOptions({
      onSuccess: () => {
        toast.success("OSM import started");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  return (
    <AppLayout title="OSM Data Sources">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            OSM Data Sources
          </h1>
          <p className="text-muted-foreground">
            Manage offline OpenStreetMap imports for Czech
            Republic and Slovakia.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {data.map((source) => {
            const status = source.status as StatusKey;
            const isActive = ACTIVE_STATUSES.has(status);
            const isFailed = status === "failed";
            const isCompleted = status === "completed";
            const actionLabel = isCompleted
              ? "Update"
              : "Import";

            const sourceCode = source.code as "cz" | "sk";

            return (
              <Card key={source.id}>
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-xl">
                        {source.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {source.geofabrikUrl}
                      </p>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Progress
                      </span>
                      <span>{source.progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${source.progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Last import</span>
                      <span>
                        {source.lastImportedAt
                          ? new Date(
                              source.lastImportedAt
                            ).toLocaleString()
                          : "Never"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>File size</span>
                      <span>
                        {source.fileSizeBytes
                          ? `${Math.round(source.fileSizeBytes / 1024 / 1024)} MB`
                          : "Unknown"}
                      </span>
                    </div>
                  </div>

                  {isFailed && source.errorMessage ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {source.errorMessage}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() =>
                        startImport.mutate({
                          sourceCode,
                        })
                      }
                      disabled={
                        startImport.isPending || isActive
                      }
                    >
                      {isActive ? (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                      ) : isCompleted ? (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      ) : (
                        <CloudDownload className="mr-2 h-4 w-4" />
                      )}
                      {actionLabel}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Code: {source.code.toUpperCase()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

function StatusBadge({ status }: { status: StatusKey }) {
  if (status === "completed") {
    return (
      <Badge>
        <CircleCheck className="mr-1 h-3 w-3" />
        Completed
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge variant="destructive">
        <CircleX className="mr-1 h-3 w-3" />
        Failed
      </Badge>
    );
  }

  if (ACTIVE_STATUSES.has(status)) {
    return (
      <Badge variant="secondary">
        <Loader className="mr-1 h-3 w-3 animate-spin" />
        {status}
      </Badge>
    );
  }

  return <Badge variant="outline">Pending</Badge>;
}

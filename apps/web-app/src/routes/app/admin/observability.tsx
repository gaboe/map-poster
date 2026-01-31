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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Wrench,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute(
  "/app/admin/observability"
)({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.observability.getDatabaseAnalysis.queryOptions()
    );
  },
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data, refetch } = useSuspenseQuery(
    trpc.observability.getDatabaseAnalysis.queryOptions()
  );
  const [vacuumingTables, setVacuumingTables] = useState<
    string[]
  >([]);

  const { sections } = data;

  const vacuumMutation = useMutation(
    trpc.observability.vacuumTables.mutationOptions({
      onSuccess: (result) => {
        const failed = result.results.filter(
          (r) => !r.success
        );
        if (failed.length === 0) {
          toast.success("VACUUM completed successfully");
        } else {
          toast.error(
            `VACUUM failed for: ${failed.map((r) => r.table).join(", ")}`
          );
        }
        setVacuumingTables([]);
        void refetch();
      },
      onError: (error) => {
        toast.error(`VACUUM failed: ${error.message}`);
        setVacuumingTables([]);
      },
    })
  );

  const handleVacuumTable = (tableName: string) => {
    setVacuumingTables([tableName]);
    vacuumMutation.mutate({ tables: [tableName] });
  };

  const handleCopyReport = () => {
    const reportText = sections
      .map((section) => {
        const header = `## ${section.title}\n\n${section.description}\n\n${
          section.recommendations
            ? "**Issues Found**\n\n**Recommendations:**\n" +
              section.recommendations
                .map((rec) => `- ${rec}`)
                .join("\n") +
              "\n"
            : "**Healthy**\n"
        }\n`;

        if (section.data.length === 0) {
          return `${header}No data found for this analysis\n`;
        }

        const columns = Object.keys(section.data[0] ?? {});
        const columnHeaders =
          "| " +
          columns
            .map((key) =>
              key
                .split("_")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() +
                    word.slice(1)
                )
                .join(" ")
            )
            .join(" | ") +
          " |";

        const separator =
          "|" + columns.map(() => " --- ").join("|") + "|";

        const rows = section.data
          .map(
            (row) =>
              "| " +
              Object.values(row)
                .map((val) =>
                  val === null ? "null" : String(val)
                )
                .join(" | ") +
              " |"
          )
          .join("\n");

        return `${header}${columnHeaders}\n${separator}\n${rows}\n`;
      })
      .join("\n");

    navigator.clipboard
      .writeText(
        `# Database Performance Analysis\n\nReal-time analysis of database health and optimization opportunities\n\n${reportText}`
      )
      .then(() => {
        toast.success(
          "Report copied as Markdown to clipboard"
        );
      })
      .catch(() => {
        toast.error("Failed to copy report");
      });
  };

  return (
    <AppLayout title="Database Observability">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Database Performance Analysis
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time analysis of database health and
              optimization opportunities
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleCopyReport}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Report
          </Button>
        </div>

        {sections.map((section, index: number) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>
                    {section.description}
                  </CardDescription>
                </div>
                {section.recommendations ? (
                  <Badge variant="destructive">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Issues Found
                  </Badge>
                ) : (
                  <Badge variant="default">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Healthy
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.recommendations && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">
                      Recommendations:
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {section.recommendations.map(
                        (rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        )
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {section.data.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No data found for this analysis
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(
                          section.data[0] ?? {}
                        ).map((key) => (
                          <TableHead key={key}>
                            {key
                              .split("_")
                              .map(
                                (word) =>
                                  word
                                    .charAt(0)
                                    .toUpperCase() +
                                  word.slice(1)
                              )
                              .join(" ")}
                          </TableHead>
                        ))}
                        {(section.title ===
                          "Bloated Tables" ||
                          section.title ===
                            "Table Statistics") && (
                          <TableHead>Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.data.map(
                        (
                          row: Record<string, unknown>,
                          rowIndex: number
                        ) => (
                          <TableRow key={rowIndex}>
                            {Object.entries(row).map(
                              (
                                [key, value],
                                cellIndex: number
                              ) => (
                                <TableCell
                                  key={cellIndex}
                                  className="font-mono text-xs"
                                >
                                  {formatCellValue(
                                    key,
                                    value as
                                      | string
                                      | number
                                      | null
                                  )}
                                </TableCell>
                              )
                            )}
                            {(section.title ===
                              "Bloated Tables" ||
                              (section.title ===
                                "Table Statistics" &&
                                typeof row.dead_ratio_pct ===
                                  "number" &&
                                row.dead_ratio_pct >
                                  10)) && (
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleVacuumTable(
                                      row.table_name as string
                                    )
                                  }
                                  disabled={
                                    vacuumingTables.includes(
                                      row.table_name as string
                                    ) ||
                                    vacuumMutation.isPending
                                  }
                                >
                                  {vacuumingTables.includes(
                                    row.table_name as string
                                  ) ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                      Vacuuming...
                                    </>
                                  ) : (
                                    <>
                                      <Wrench className="w-3 h-3 mr-1" />
                                      VACUUM
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            )}
                            {section.title ===
                              "Table Statistics" &&
                              (typeof row.dead_ratio_pct !==
                                "number" ||
                                row.dead_ratio_pct <=
                                  10) && <TableCell />}
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}

function formatCellValue(
  key: string,
  value: string | number | null
): React.ReactNode {
  if (value === null) {
    return (
      <span className="text-muted-foreground">null</span>
    );
  }

  // Highlight critical metrics
  if (
    key === "dead_ratio_pct" &&
    typeof value === "number"
  ) {
    if (value > 10) {
      return (
        <span className="text-red-600 font-semibold">
          {value}%
        </span>
      );
    }
    return <span>{value}%</span>;
  }

  if (
    key === "cache_hit_ratio_pct" &&
    typeof value === "number"
  ) {
    if (value < 99) {
      return (
        <span className="text-red-600 font-semibold">
          {value}%
        </span>
      );
    }
    return (
      <span className="text-green-600 font-semibold">
        {value}%
      </span>
    );
  }

  if (
    key === "index_usage_pct" &&
    typeof value === "number"
  ) {
    if (value < 50) {
      return (
        <span className="text-orange-600 font-semibold">
          {value}%
        </span>
      );
    }
    return <span>{value}%</span>;
  }

  // Format dates
  if (
    typeof value === "string" &&
    value.match(/^\d{4}-\d{2}-\d{2}/)
  ) {
    return new Date(value).toLocaleString();
  }

  return String(value);
}

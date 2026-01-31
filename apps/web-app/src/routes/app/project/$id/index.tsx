import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import {
  useSuspenseQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { useTRPC } from "@/infrastructure/trpc/react";
import { AppLayout } from "@/shared/layout/app-layout";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { IconSettings } from "@tabler/icons-react";

export const Route = createFileRoute("/app/project/$id/")({
  loader: async ({ context, params }) => {
    const projectData =
      await context.queryClient.fetchQuery(
        context.trpc.project.getById.queryOptions({
          projectId: params.id,
        })
      );

    // Conditionally prefetch organization data
    if (projectData?.project?.organizationId) {
      void context.queryClient.prefetchQuery(
        context.trpc.organization.getById.queryOptions({
          organizationId:
            projectData.project.organizationId,
        })
      );
    }

    // Prefetch project members
    void context.queryClient.prefetchQuery(
      context.trpc.projectPermissions.getProjectMembers.queryOptions(
        { projectId: params.id }
      )
    );
  },
  component: ProjectPage,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function ProjectPage() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(
    trpc.project.getById.queryOptions({ projectId: id })
  );

  const { data: organizationData } = useSuspenseQuery(
    trpc.organization.getById.queryOptions({
      organizationId: data?.project?.organizationId || "",
    })
  );

  const { data: members } = useSuspenseQuery(
    trpc.projectPermissions.getProjectMembers.queryOptions({
      projectId: id,
    })
  );

  // Force cache invalidation when project ID changes
  useEffect(() => {
    void queryClient.invalidateQueries({
      queryKey: ["trpc", "apiKeys"],
    });
  }, [id, queryClient]);

  return (
    <AppLayout
      title={
        <>
          <Link
            to="/app/organization/$id"
            params={{ id: data?.project?.organizationId }}
            className="hover:underline"
          >
            {organizationData?.organization?.name}
          </Link>
          {"/"}
          <Link
            to="/app/project/$id"
            params={{ id }}
            className="hover:underline"
          >
            {data?.project?.name}
          </Link>
        </>
      }
      headerActions={
        <Link
          to="/app/project/$id/settings"
          params={{ id }}
        >
          <Button variant="secondary" size="sm">
            <IconSettings className="size-4 mr-2" />
            <span className="hidden sm:inline">
              Settings
            </span>
            <span className="sm:hidden">Settings</span>
          </Button>
        </Link>
      }
    >
      {/* Project Overview */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">
          Project Overview
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card size="sm" className="py-0">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">
                Created
              </div>
              <div className="text-lg font-medium">
                {new Date(
                  data?.project?.createdAt
                ).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          <Card size="sm" className="py-0">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">
                Team Members
              </div>
              <div className="text-lg font-medium">
                {members?.length ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card size="sm" className="py-0">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">
                Organization
              </div>
              <div className="text-lg font-medium truncate">
                {organizationData?.organization?.name}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team Members */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">
          Team Members
        </h3>
        <Card className="overflow-hidden py-0">
          <CardContent className="p-0">
            <div className="divide-y">
              {members?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No team members yet
                </div>
              ) : (
                members?.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name ?? "User"}
                          className="size-10 rounded-full"
                        />
                      ) : (
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {member.name
                              ?.charAt(0)
                              .toUpperCase() ?? "?"}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {member.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm px-3 py-1 bg-muted rounded-full capitalize">
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

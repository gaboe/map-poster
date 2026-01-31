import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/infrastructure/trpc/react";
import { AppLayout } from "@/shared/layout/app-layout";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import { MemberAvatar } from "@/shared/ui/member-avatar";
import { CreateProjectDialog } from "@/organizations/components/create-project-dialog";
import { IconUsers } from "@tabler/icons-react";
import { getSortPreferenceServerFn } from "@/infrastructure/sort-preferences";
import { ProjectCard } from "@/projects/components/project-card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyContent,
} from "@/shared/ui/empty";

export const Route = createFileRoute(
  "/app/organization/$id/"
)({
  loader: async ({ context, params }) => {
    // Critical: Organization detail for main content
    await context.queryClient.prefetchQuery(
      context.trpc.organization.getOrganizationDetail.queryOptions(
        {
          organizationId: params.id,
        }
      )
    );

    void context.queryClient.prefetchQuery(
      context.trpc.organization.getOrganizationsDetails.queryOptions()
    );
    void context.queryClient.prefetchQuery(
      context.trpc.organizationMember.getMembersByOrganizationId.queryOptions(
        { organizationId: params.id }
      )
    );

    const sortPreference = await getSortPreferenceServerFn({
      data: "organization",
    });

    return { sortPreference };
  },
  component: OrganizationOverview,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function OrganizationOverview() {
  const { id } = Route.useParams();
  const trpc = useTRPC();

  const { data: orgDetail } = useSuspenseQuery(
    trpc.organization.getOrganizationDetail.queryOptions({
      organizationId: id,
    })
  );

  const organization = orgDetail?.organization;
  const projects = orgDetail?.projects || [];
  const displayMembers = orgDetail?.members || [];

  return (
    <AppLayout
      title={organization?.name}
      subtitle={undefined}
      description=""
    >
      {/* Projects section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-md font-semibold">
            Projects
          </h3>
          {organization?.id && (
            <CreateProjectDialog
              organizationId={organization.id}
            />
          )}
        </div>
        {projects.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No projects yet</EmptyTitle>
            </EmptyHeader>
            {organization?.id && (
              <EmptyContent>
                <CreateProjectDialog
                  organizationId={organization.id}
                />
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
              />
            ))}
          </div>
        )}
      </div>

      {/* Members section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-md font-semibold">Members</h3>
          <div className="flex gap-2">
            <Link
              to="/app/organization/$id/members"
              params={{ id }}
            >
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-sm"
              >
                <IconUsers className="size-4" />
                Manage
              </Button>
            </Link>
          </div>
        </div>
        {displayMembers.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No members yet</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayMembers.map((member) => {
              const id = member.id ?? "";
              const name = member.name ?? "";
              const role = member.role ?? "";
              const image =
                "image" in member
                  ? member.image
                  : undefined;
              return (
                <Card
                  key={id}
                  size="sm"
                  className="py-0 transition-colors hover:bg-muted/50"
                >
                  <CardContent className="p-2 flex items-center gap-2">
                    <MemberAvatar
                      name={name}
                      {...(image !== undefined && {
                        image,
                      })}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {name}
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs mt-1"
                      >
                        {role}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

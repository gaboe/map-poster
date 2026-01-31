import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/shared/layout/app-layout";
import { Link } from "@tanstack/react-router";
import { Button } from "@/shared/ui/button";
import { CreateOrganizationDialog } from "@/organizations/components/create-organization-dialog";
import { CreateProjectDialog } from "@/organizations/components/create-project-dialog";
import {
  useSuspenseQuery,
  useMutation,
} from "@tanstack/react-query";
import { useTRPC } from "@/infrastructure/trpc/react";
import { ProjectCard } from "@/projects/components/project-card";
import { StatCard } from "@/shared/ui/stat-card";
import { ResponsiveCard } from "@/shared/ui/responsive-card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/shared/ui/empty";
import { IconEye, IconBug } from "@tabler/icons-react";
import { getSortPreferenceServerFn } from "@/infrastructure/sort-preferences";
import { OrganizationRoles } from "@map-poster/common";
import { PendingInvitationModal } from "@/dashboard/pending-invitation-modal";
import { toast } from "sonner";
import { Suspense } from "react";

export const Route = createFileRoute("/app/dashboard")({
  loader: async ({ context }) => {
    // Fetch critical data and prefetch secondary data in parallel
    const [orgsWithProjects, sortPreference] =
      await Promise.all([
        context.queryClient.fetchQuery(
          context.trpc.organization.getOrganizationsDetails.queryOptions()
        ),
        getSortPreferenceServerFn({
          data: "dashboard",
        }),
      ]);

    // Prefetch pending invitations (used by PendingInvitationModal)
    void context.queryClient.prefetchQuery(
      context.trpc.organizationInvitations.getPendingInvitationsForUser.queryOptions()
    );

    return { orgsWithProjects, sortPreference };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const trpc = useTRPC();

  const { data: orgsWithProjects = [] } = useSuspenseQuery(
    trpc.organization.getOrganizationsDetails.queryOptions()
  );

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

  const hasOrganizations = orgsWithProjects.length > 0;

  // Separate admin and member organizations
  const adminOrgs = orgsWithProjects.filter(
    (org) =>
      org.userRole === OrganizationRoles.Owner ||
      org.userRole === OrganizationRoles.Admin
  );
  const memberOrgs = orgsWithProjects.filter(
    (org) => org.userRole === OrganizationRoles.Member
  );

  const totalProjects = orgsWithProjects.reduce(
    (acc, org) => acc + org.projects.length,
    0
  );

  return (
    <AppLayout
      title="Dashboard"
      description="Manage your organizations and projects"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 xl:py-6">
        {/* Stats Section */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 xl:gap-4 mb-4 xl:mb-6">
          <StatCard
            label="Organizations"
            value={orgsWithProjects.length}
          />
          {adminOrgs.length > 0 && (
            <StatCard
              label="Projects"
              value={totalProjects}
            />
          )}
          {memberOrgs.length > 0 &&
            adminOrgs.length === 0 && (
              <div className="col-span-2 sm:col-span-2">
                <StatCard
                  label="Member of"
                  value={`${memberOrgs.length} organization${memberOrgs.length === 1 ? "" : "s"}`}
                />
              </div>
            )}
        </div>

        {/* Sentry Test Buttons */}
        <div className="mb-4 xl:mb-6 flex gap-2">
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

        {/* Organizations and Projects */}
        {hasOrganizations ? (
          <div className="space-y-4 xl:space-y-6">
            {/* Header with Create Organization Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                My Organizations
              </h2>
              <CreateOrganizationDialog />
            </div>
            {orgsWithProjects.map((orgWithProjects) => {
              const userRole = orgWithProjects.userRole;
              const isAdmin =
                userRole === OrganizationRoles.Owner ||
                userRole === OrganizationRoles.Admin;
              const isMember =
                userRole === OrganizationRoles.Member;

              return (
                <ResponsiveCard
                  key={orgWithProjects.organization.id}
                  padding="md"
                >
                  <div className="mb-4 xl:mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg xl:text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {
                            orgWithProjects.organization
                              .name
                          }
                        </h2>
                        {isMember ? (
                          <p className="text-sm text-muted-foreground mt-1">
                            You are a member of this
                            organization
                          </p>
                        ) : null}
                      </div>
                      {isAdmin && (
                        <Link
                          to="/app/organization/$id"
                          params={{
                            id: orgWithProjects.organization
                              .id,
                          }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-sm"
                          >
                            <IconEye className="size-3 mr-1" />
                            View
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Projects Section */}
                  {orgWithProjects.projects.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-3 xl:mb-4">
                        <h3 className="text-sm xl:text-base font-medium text-gray-900 dark:text-gray-100">
                          Projects
                        </h3>
                        {isAdmin && (
                          <CreateProjectDialog
                            organizationId={
                              orgWithProjects.organization
                                .id
                            }
                          />
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4">
                        {orgWithProjects.projects.map(
                          (project) => (
                            <ProjectCard
                              key={project.id}
                              project={project}
                              disabled={isMember}
                            />
                          )
                        )}
                      </div>
                    </>
                  ) : (
                    <Empty className="border-0 p-0 py-8 xl:py-10">
                      <EmptyHeader>
                        <EmptyTitle>
                          No projects yet
                        </EmptyTitle>
                        {!isAdmin && (
                          <EmptyDescription>
                            Contact an admin to create
                            projects
                          </EmptyDescription>
                        )}
                      </EmptyHeader>
                      {isAdmin && (
                        <EmptyContent>
                          <CreateProjectDialog
                            organizationId={
                              orgWithProjects.organization
                                .id
                            }
                          />
                        </EmptyContent>
                      )}
                    </Empty>
                  )}
                </ResponsiveCard>
              );
            })}
          </div>
        ) : (
          <Empty className="py-12 xl:py-16">
            <EmptyHeader>
              <EmptyTitle>Welcome to map-poster</EmptyTitle>
              <EmptyDescription>
                Get started by creating your first
                organization.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <CreateOrganizationDialog />
            </EmptyContent>
          </Empty>
        )}
      </div>

      <Suspense fallback={null}>
        <PendingInvitationModal />
      </Suspense>
    </AppLayout>
  );
}

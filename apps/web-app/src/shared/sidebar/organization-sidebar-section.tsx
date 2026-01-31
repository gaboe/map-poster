import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/infrastructure/trpc/react";
import {
  SidebarMenuItem,
  SidebarGroupLabel,
} from "@/shared/ui/sidebar";
import type { RouterOutputs } from "@/infrastructure/trpc/router";
import { PrimaryMenuButton } from "@/shared/ui/sidebar/primary-menu-button";
import { SecondaryMenuButton } from "@/shared/ui/sidebar/secondary-menu-button";
import { Fragment } from "react";
import {
  IconBuilding,
  IconFolderOpen,
  IconSettings,
  IconLayoutGrid,
} from "@tabler/icons-react";
import { OrganizationRoles } from "@map-poster/common";
type OrganizationWithProjects =
  RouterOutputs["organization"]["getOrganizationsDetails"][number];

export default function OrganizationSidebarSections({
  currentPath,
}: {
  currentPath: string;
}) {
  const trpc = useTRPC();
  const { data: orgsWithProjects = [] } = useSuspenseQuery(
    trpc.organization.getOrganizationsDetails.queryOptions()
  );

  const hasMultipleOrgs = orgsWithProjects.length > 1;

  return (
    <>
      {/* My Organizations Section Header */}
      {orgsWithProjects.length > 0 && (
        <SidebarMenuItem>
          <SidebarGroupLabel className="flex items-center gap-2">
            <IconBuilding className="size-4" />
            <span>My Organizations</span>
          </SidebarGroupLabel>
        </SidebarMenuItem>
      )}

      {orgsWithProjects.map(
        ({
          organization,
          userRole,
        }: OrganizationWithProjects) => {
          const orgBasePath = `/app/organization/${organization.id}`;
          const orgDashboardActive =
            currentPath === orgBasePath ||
            currentPath === `${orgBasePath}/dashboard`;

          const isOrgAdmin =
            userRole === OrganizationRoles.Admin ||
            userRole === OrganizationRoles.Owner;
          const isMember =
            userRole === OrganizationRoles.Member;

          const isOnOrgPage = currentPath.startsWith(
            `/app/organization/${organization.id}`
          );
          const isExpanded =
            !hasMultipleOrgs || isOnOrgPage;

          return (
            <Fragment key={organization.id}>
              {/* Organization Dashboard */}
              {isOrgAdmin && (
                <SidebarMenuItem>
                  <PrimaryMenuButton
                    render={
                      <Link
                        to="/app/organization/$id"
                        params={{ id: organization.id }}
                      />
                    }
                    className={[
                      "pl-2",
                      orgDashboardActive
                        ? "bg-primary/10 font-bold"
                        : "",
                    ].join(" ")}
                  >
                    <span>{organization.name}</span>
                  </PrimaryMenuButton>
                </SidebarMenuItem>
              )}

              {/* Member view */}
              {isMember && (
                <SidebarMenuItem>
                  <div className="pl-2 py-2 text-sm text-muted-foreground">
                    <span>{organization.name}</span>
                    <span className="ml-2 text-xs">
                      (member)
                    </span>
                  </div>
                </SidebarMenuItem>
              )}

              {/* Organization sections - only for admins and when expanded */}
              {isOrgAdmin && isExpanded && (
                <>
                  <SidebarMenuItem>
                    <SecondaryMenuButton
                      render={
                        <Link
                          to="/app/organization/$id/settings"
                          params={{ id: organization.id }}
                        />
                      }
                      className={[
                        "pl-8",
                        currentPath ===
                        `${orgBasePath}/settings`
                          ? "bg-primary/10 font-bold"
                          : "",
                      ].join(" ")}
                    >
                      <span>Settings</span>
                    </SecondaryMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SecondaryMenuButton
                      render={
                        <Link
                          to="/app/organization/$id/members"
                          params={{ id: organization.id }}
                        />
                      }
                      className={[
                        "pl-8",
                        currentPath ===
                        `${orgBasePath}/members`
                          ? "bg-primary/10 font-bold"
                          : "",
                      ].join(" ")}
                    >
                      <span>Members</span>
                    </SecondaryMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </Fragment>
          );
        }
      )}

      {/* My Projects Section Header - show if any org has projects */}
      {orgsWithProjects.some(
        (org) => org.projects.length > 0
      ) && (
        <SidebarMenuItem>
          <SidebarGroupLabel className="flex items-center gap-2">
            <IconFolderOpen className="size-4" />
            <span>My Projects</span>
          </SidebarGroupLabel>
        </SidebarMenuItem>
      )}

      {/* Render projects from all organizations */}
      {orgsWithProjects.map(
        ({ organization, projects, userRole }) => {
          const isOrgAdmin =
            userRole === OrganizationRoles.Owner ||
            userRole === OrganizationRoles.Admin;
          const isMember =
            userRole === OrganizationRoles.Member;

          const sortedProjects = [...projects].sort(
            (a, b) => a.name.localeCompare(b.name)
          );

          return sortedProjects.length > 0 ? (
            <Fragment key={`projects-${organization.id}`}>
              {sortedProjects.map((project) => {
                const projectBasePath = `/app/project/${project.id}`;
                const isProjectActive =
                  isOrgAdmin &&
                  currentPath.startsWith(projectBasePath);

                return (
                  <Fragment key={project.id}>
                    <SidebarMenuItem>
                      {isMember ? (
                        <div className="py-2 text-sm text-muted-foreground flex items-center gap-2">
                          <span>/{project.name}</span>
                          <span className="text-xs">
                            (member)
                          </span>
                        </div>
                      ) : (
                        <SecondaryMenuButton
                          render={
                            <Link
                              to="/app/project/$id"
                              params={{ id: project.id }}
                            />
                          }
                          className={[
                            currentPath === projectBasePath
                              ? "bg-primary/10 font-bold"
                              : "",
                          ].join(" ")}
                        >
                          <span>/{project.name}</span>
                        </SecondaryMenuButton>
                      )}
                    </SidebarMenuItem>

                    {/* Project sub-pages - show only for admins when in this project */}
                    {isProjectActive && isOrgAdmin && (
                      <>
                        <SidebarMenuItem>
                          <SecondaryMenuButton
                            render={
                              <Link
                                to="/app/project/$id"
                                params={{ id: project.id }}
                              />
                            }
                            className={[
                              "pl-8",
                              currentPath ===
                                projectBasePath ||
                              currentPath.startsWith(
                                `${projectBasePath}/api-reference`
                              )
                                ? "bg-primary/10 font-bold"
                                : "",
                            ].join(" ")}
                          >
                            <IconLayoutGrid className="!size-4 mr-2" />
                            <span>Dashboard</span>
                          </SecondaryMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                          <SecondaryMenuButton
                            render={
                              <Link
                                to="/app/project/$id/settings"
                                params={{ id: project.id }}
                              />
                            }
                            className={[
                              "pl-8",
                              currentPath ===
                              `${projectBasePath}/settings`
                                ? "bg-primary/10 font-bold"
                                : "",
                            ].join(" ")}
                          >
                            <IconSettings className="!size-4 mr-2" />
                            <span>Settings</span>
                          </SecondaryMenuButton>
                        </SidebarMenuItem>
                      </>
                    )}
                  </Fragment>
                );
              })}
            </Fragment>
          ) : null;
        }
      )}
    </>
  );
}

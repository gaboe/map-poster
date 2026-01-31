import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import {
  useSuspenseQuery,
  useMutation,
} from "@tanstack/react-query";
import { useState } from "react";
import { useTRPC } from "@/infrastructure/trpc/react";
import { AppLayout } from "@/shared/layout/app-layout";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { MemberAvatar } from "@/shared/ui/member-avatar";
import { CreateButton } from "@/shared/ui/create-button";
import { InviteMemberModal } from "@/organizations/components/invite-member-modal";
import { EditMemberRoleModal } from "@/organizations/components/edit-member-role-modal";
import { DeleteMemberModal } from "@/organizations/components/delete-member-modal";
import { ManageProjectPermissionsModal } from "@/organizations/components/manage-project-permissions-modal";
import { toast } from "sonner";
import {
  OrganizationRoles,
  type ProjectRoles,
} from "@map-poster/common";
import { useUserInfo } from "@/hooks/users/use-user-info";

export const Route = createFileRoute(
  "/app/organization/$id/members"
)({
  component: RouteComponent,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async ({ context, params }) => {
    // Prefetch all critical data in parallel
    await Promise.all([
      context.queryClient.prefetchQuery(
        context.trpc.organization.getById.queryOptions({
          organizationId: params.id,
        })
      ),
      context.queryClient.prefetchQuery(
        context.trpc.organization.getOrganizationDetail.queryOptions(
          {
            organizationId: params.id,
          }
        )
      ),
      context.queryClient.prefetchQuery(
        context.trpc.organizationMember.getMembersByOrganizationId.queryOptions(
          {
            organizationId: params.id,
          }
        )
      ),
      context.queryClient.prefetchQuery(
        context.trpc.projectPermissions.getOrganizationMembersWithAllProjectPermissions.queryOptions(
          {
            organizationId: params.id,
          }
        )
      ),
    ]);
  },
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();

  // Get current user info
  const { data: userInfo } = useUserInfo();
  const currentUserId = userInfo?.id;
  const [isInviteModalOpen, setIsInviteModalOpen] =
    useState(false);
  const [editRoleModal, setEditRoleModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    currentRole: string;
  }>({
    isOpen: false,
    userId: "",
    userName: "",
    currentRole: "",
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
  }>({ isOpen: false, userId: "", userName: "" });

  const [manageProjectModal, setManageProjectModal] =
    useState<{
      isOpen: boolean;
      userId: string;
      userName: string;
      userEmail: string;
      userImage?: string | null;
      organizationRole: string;
    }>({
      isOpen: false,
      userId: "",
      userName: "",
      userEmail: "",
      userImage: null,
      organizationRole: "",
    });

  const { data: organization } = useSuspenseQuery(
    trpc.organization.getById.queryOptions({
      organizationId: id,
    })
  );

  const { data: members = [], refetch: refetchMembers } =
    useSuspenseQuery(
      trpc.organizationMember.getMembersByOrganizationId.queryOptions(
        { organizationId: id }
      )
    );

  // Note: Invitations are now represented as placeholder users with emailVerified: false
  // No need for separate invitations query

  const {
    data: projectPermissionsData,
    refetch: refetchProjectPermissions,
  } = useSuspenseQuery(
    trpc.projectPermissions.getOrganizationMembersWithAllProjectPermissions.queryOptions(
      {
        organizationId: id,
      }
    )
  );

  // Use only members - pending invitations are already placeholder users with emailVerified: false
  const displayMembers = members;

  // Note: No separate invitation deletion needed - placeholder users are just members

  const updateMemberRole = useMutation(
    trpc.organizationMember.updateMemberRole.mutationOptions(
      {
        onSuccess: () => {
          toast.success("Member role updated successfully");
          void refetchMembers();
          setEditRoleModal({
            isOpen: false,
            userId: "",
            userName: "",
            currentRole: "",
          });
        },
        onError: (error) => {
          toast.error(
            error.message || "Failed to update member role"
          );
        },
      }
    )
  );

  const removeMember = useMutation(
    trpc.organizationMember.removeMember.mutationOptions({
      onSuccess: () => {
        toast.success("Member removed successfully");
        void refetchMembers();
        void refetchProjectPermissions();
        setDeleteModal({
          isOpen: false,
          userId: "",
          userName: "",
        });
      },
      onError: (error) => {
        toast.error(
          error.message || "Failed to remove member"
        );
      },
    })
  );

  const addProjectMember = useMutation(
    trpc.projectPermissions.addProjectMember.mutationOptions(
      {
        onSuccess: () => {
          toast.success("Project permission updated");
          void refetchProjectPermissions();
        },
        onError: (error) => {
          toast.error(
            error.message ||
              "Failed to update project permission"
          );
        },
      }
    )
  );

  const updateProjectMemberRole = useMutation(
    trpc.projectPermissions.updateProjectMemberRole.mutationOptions(
      {
        onSuccess: () => {
          toast.success("Project role updated");
          void refetchProjectPermissions();
        },
        onError: (error) => {
          toast.error(
            error.message || "Failed to update project role"
          );
        },
      }
    )
  );

  const removeProjectMember = useMutation(
    trpc.projectPermissions.removeProjectMember.mutationOptions(
      {
        onSuccess: () => {
          toast.success("Project access removed");
          void refetchProjectPermissions();
        },
        onError: (error) => {
          toast.error(
            error.message ||
              "Failed to remove project access"
          );
        },
      }
    )
  );

  // Check if current user is owner or admin
  const currentUserMembership = members.find(
    (m) => m.id === currentUserId
  );
  const canManageMembers =
    currentUserMembership?.role ===
      OrganizationRoles.Owner ||
    currentUserMembership?.role === OrganizationRoles.Admin;

  // Handle project role updates
  const handleProjectRoleUpdate = async (
    projectId: string,
    newRole: string | null
  ) => {
    const userId = manageProjectModal.userId;

    // Get current permission for this project
    const memberData = projectPermissionsData?.members.find(
      (m) => m.id === userId
    );
    const currentPermission =
      memberData?.projectPermissions.find(
        (p) => p.projectId === projectId
      );

    if (newRole === null) {
      // Remove access
      if (currentPermission?.hasAccess) {
        await removeProjectMember.mutateAsync({
          projectId,
          userId,
        });
      }
    } else {
      // Add or update access
      if (currentPermission?.hasAccess) {
        // Update existing role
        await updateProjectMemberRole.mutateAsync({
          projectId,
          userId,
          role: newRole as (typeof ProjectRoles)[keyof typeof ProjectRoles],
        });
      } else {
        // Add new role
        await addProjectMember.mutateAsync({
          projectId,
          userId,
          role: newRole as (typeof ProjectRoles)[keyof typeof ProjectRoles],
        });
      }
    }
  };

  return (
    <AppLayout
      title={
        <Link
          to="/app/organization/$id"
          params={{ id }}
          className="hover:underline"
        >
          {organization.organization?.name}
        </Link>
      }
      subtitle="Members"
      description={
        <>
          View and manage <strong>organization</strong>{" "}
          members and their project permissions.
        </>
      }
      headerActions={
        canManageMembers && (
          <CreateButton
            onClick={() => {
              setIsInviteModalOpen(true);
            }}
            title="Add Member"
            tooltip="Invite a new member to this organization"
          />
        )
      }
    >
      {displayMembers.length === 0 ? (
        <div className="text-muted-foreground">
          No members yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="px-4 py-2 text-left"> </th>
                <th className="px-4 py-2 text-left">
                  Name
                </th>
                <th className="px-4 py-2 text-left">
                  Email
                </th>
                <th className="px-4 py-2 text-left">
                  Organization Role
                </th>
                <th className="px-4 py-2 text-left">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayMembers.map((member) => {
                const id = member.id ?? "";
                const name = member.name ?? "";
                const email = member.email ?? "";
                const role = member.role ?? "";

                // Get project permissions for this member
                const memberProjectData =
                  projectPermissionsData?.members.find(
                    (m) => m.id === id
                  );

                return (
                  <tr
                    key={`member-${String(id)}`}
                    className={`border-b ${!member.emailVerified ? "bg-muted/30" : ""}`}
                  >
                    <td className="px-4 py-2">
                      <MemberAvatar
                        name={name}
                        image={member.image}
                      />
                    </td>
                    <td className="px-4 py-2">
                      {member.emailVerified ? (
                        name
                      ) : (
                        <span className="text-muted-foreground">
                          {email}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">{email}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {role}
                        </Badge>
                        {!member.emailVerified && (
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            Invitation sent
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {canManageMembers &&
                        id !== currentUserId && (
                          <div className="flex gap-2">
                            {member.emailVerified ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditRoleModal({
                                    isOpen: true,
                                    userId: id,
                                    userName: name,
                                    currentRole: role,
                                  });
                                }}
                              >
                                Edit
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setManageProjectModal({
                                    isOpen: true,
                                    userId: id,
                                    userName: name,
                                    userEmail: email,
                                    userImage: member.image,
                                    organizationRole: role,
                                  });
                                }}
                              >
                                Pending
                              </Button>
                            )}
                            {(() => {
                              const totalProjects =
                                projectPermissionsData
                                  ?.projects?.length || 0;
                              const hasProjectAccess =
                                memberProjectData?.projectPermissions?.filter(
                                  (p) => p.hasAccess
                                ) || [];
                              const isOrgAdmin =
                                role ===
                                  OrganizationRoles.Admin ||
                                role ===
                                  OrganizationRoles.Owner;

                              if (totalProjects > 0) {
                                return (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="hover:bg-primary/10 hover:text-primary transition-colors"
                                    onClick={() => {
                                      setManageProjectModal(
                                        {
                                          isOpen: true,
                                          userId: id,
                                          userName: name,
                                          userEmail: email,
                                          userImage:
                                            member.image,
                                          organizationRole:
                                            role,
                                        }
                                      );
                                    }}
                                  >
                                    {isOrgAdmin
                                      ? `Projects (${totalProjects})`
                                      : `Projects (${hasProjectAccess.length}/${totalProjects})`}
                                  </Button>
                                );
                              }
                              return null;
                            })()}
                            {member.emailVerified ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setDeleteModal({
                                    isOpen: true,
                                    userId: id,
                                    userName: name,
                                  });
                                }}
                                disabled={
                                  role ===
                                    OrganizationRoles.Owner &&
                                  members.filter(
                                    (m) =>
                                      m.role ===
                                      OrganizationRoles.Owner
                                  ).length === 1
                                }
                              >
                                Delete
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setDeleteModal({
                                    isOpen: true,
                                    userId: id,
                                    userName: email, // Use email for display name for pending
                                  });
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
        }}
        organizationId={id}
        onInviteSuccess={() => {
          // Refetch members to show new placeholder users
          void refetchMembers();
          void refetchProjectPermissions();
        }}
      />

      <EditMemberRoleModal
        isOpen={editRoleModal.isOpen}
        onClose={() => {
          setEditRoleModal({
            isOpen: false,
            userId: "",
            userName: "",
            currentRole: "",
          });
        }}
        userName={editRoleModal.userName}
        currentRole={editRoleModal.currentRole}
        onRoleChange={(value) => {
          updateMemberRole.mutate({
            organizationId: id,
            userId: editRoleModal.userId,
            newRole:
              value as (typeof OrganizationRoles)[keyof typeof OrganizationRoles],
          });
        }}
      />

      <DeleteMemberModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          setDeleteModal({
            isOpen: false,
            userId: "",
            userName: "",
          });
        }}
        userName={deleteModal.userName}
        onConfirm={() => {
          // Always use removeMember - pending invitations are just placeholder members
          removeMember.mutate({
            organizationId: id,
            userId: deleteModal.userId,
          });
        }}
        isDeleting={removeMember.isPending}
      />

      {manageProjectModal.isOpen && (
        <ManageProjectPermissionsModal
          isOpen={manageProjectModal.isOpen}
          onClose={() => {
            setManageProjectModal({
              isOpen: false,
              userId: "",
              userName: "",
              userEmail: "",
              userImage: null,
              organizationRole: "",
            });
          }}
          userName={manageProjectModal.userName}
          userEmail={manageProjectModal.userEmail}
          {...(manageProjectModal.userImage !==
            undefined && {
            userImage: manageProjectModal.userImage,
          })}
          organizationRole={
            manageProjectModal.organizationRole
          }
          projectPermissions={
            projectPermissionsData?.members.find(
              (m) => m.id === manageProjectModal.userId
            )?.projectPermissions || []
          }
          projects={projectPermissionsData?.projects || []}
          onUpdateProjectRole={handleProjectRoleUpdate}
        />
      )}
    </AppLayout>
  );
}

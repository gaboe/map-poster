import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import { useAppForm } from "@/shared/forms/form-context";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { FormInput } from "@/shared/forms/form-input";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useTRPC } from "@/infrastructure/trpc/react";
import { Schema } from "effect";
import { AppLayout } from "@/shared/layout/app-layout";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { ProjectMembersTable } from "@/project-permissions/components/project-members-table";
import { AddMemberModal } from "@/project-permissions/components/add-member-modal";
import { RemoveMemberModal } from "@/project-permissions/components/remove-member-modal";
import { EditRoleModal } from "@/project-permissions/components/edit-role-modal";
import { IconUserPlus } from "@tabler/icons-react";
import type { ProjectRoleValue } from "@map-poster/common";

const ProjectSettingsFormSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, {
      message: () => "Project name is required",
    })
  ),
});

export const Route = createFileRoute(
  "/app/project/$id/settings"
)({
  loader: async ({ context, params }) => {
    // First get the project to know the organization ID
    const projectData =
      await context.queryClient.fetchQuery(
        context.trpc.project.getById.queryOptions({
          projectId: params.id,
        })
      );

    // Prefetch all critical queries in parallel
    if (projectData?.project?.organizationId) {
      await Promise.all([
        context.queryClient.prefetchQuery(
          context.trpc.projectPermissions.getProjectMembers.queryOptions(
            {
              projectId: params.id,
            }
          )
        ),
        context.queryClient.prefetchQuery(
          context.trpc.organization.getById.queryOptions({
            organizationId:
              projectData.project.organizationId,
          })
        ),
        context.queryClient.prefetchQuery(
          context.trpc.projectPermissions.getOrganizationMembersWithProjectAccess.queryOptions(
            {
              organizationId:
                projectData.project.organizationId,
              projectId: params.id,
            }
          )
        ),
      ]);
    }
  },
  component: RouteComponent,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);
  const [confirmationName, setConfirmationName] =
    useState("");

  // Project members modal states
  const [showAddMemberModal, setShowAddMemberModal] =
    useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] =
    useState(false);
  const [showEditRoleModal, setShowEditRoleModal] =
    useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role: ProjectRoleValue;
  } | null>(null);
  const { data } = useSuspenseQuery(
    trpc.project.getById.queryOptions({ projectId: id })
  );
  const project = data?.project;

  // Project members queries
  const { data: projectMembers } = useSuspenseQuery(
    trpc.projectPermissions.getProjectMembers.queryOptions({
      projectId: id,
    })
  );

  const { data: organizationData } = useSuspenseQuery(
    trpc.organization.getById.queryOptions({
      organizationId: project?.organizationId || "",
    })
  );

  const { data: organizationMembers } = useSuspenseQuery(
    trpc.projectPermissions.getOrganizationMembersWithProjectAccess.queryOptions(
      {
        organizationId: project?.organizationId || "",
        projectId: id,
      }
    )
  );

  const updateProjectName = useMutation(
    trpc.project.updateProjectName.mutationOptions({
      onSuccess: async () => {
        toast.success("Project name saved!");
        await queryClient.invalidateQueries(
          trpc.organization.getOrganizationsDetails.queryOptions()
        );
        await queryClient.invalidateQueries(
          trpc.project.getById.queryOptions({
            projectId: id,
          })
        );
      },
      onError: (error) => {
        toast.error(
          error.message || "Failed to save project name."
        );
      },
    })
  );

  const deleteProject = useMutation(
    trpc.project.deleteProject.mutationOptions({
      onSuccess: async () => {
        toast.success("Project deleted successfully");

        // Invalidate all organization-related queries to refresh the data
        if (project?.organizationId) {
          await queryClient.invalidateQueries(
            trpc.organization.getById.queryOptions({
              organizationId: project.organizationId,
            })
          );
          await queryClient.invalidateQueries(
            trpc.organization.getOrganizationDetail.queryOptions(
              {
                organizationId: project.organizationId,
              }
            )
          );
        }
        await queryClient.invalidateQueries(
          trpc.organization.getOrganizationsDetails.queryOptions()
        );

        // Navigate back to organization page
        void navigate({
          to: "/app/organization/$id",
          params: { id: project?.organizationId || "" },
        });
      },
      onError: (error) => {
        toast.error(
          error.message || "Failed to delete project"
        );
      },
    })
  );

  // Project member mutations
  const addProjectMember = useMutation(
    trpc.projectPermissions.addProjectMember.mutationOptions(
      {
        onSuccess: async () => {
          toast.success("Member added successfully");
          await queryClient.invalidateQueries(
            trpc.projectPermissions.getProjectMembers.queryOptions(
              { projectId: id }
            )
          );
          await queryClient.invalidateQueries(
            trpc.projectPermissions.getOrganizationMembersWithProjectAccess.queryOptions(
              {
                organizationId:
                  project?.organizationId || "",
                projectId: id,
              }
            )
          );
        },
        onError: (error) => {
          toast.error(
            error.message || "Failed to add member"
          );
        },
      }
    )
  );

  const removeProjectMember = useMutation(
    trpc.projectPermissions.removeProjectMember.mutationOptions(
      {
        onSuccess: async () => {
          toast.success("Member removed successfully");
          await queryClient.invalidateQueries(
            trpc.projectPermissions.getProjectMembers.queryOptions(
              { projectId: id }
            )
          );
          await queryClient.invalidateQueries(
            trpc.projectPermissions.getOrganizationMembersWithProjectAccess.queryOptions(
              {
                organizationId:
                  project?.organizationId || "",
                projectId: id,
              }
            )
          );
        },
        onError: (error) => {
          toast.error(
            error.message || "Failed to remove member"
          );
        },
      }
    )
  );

  const updateProjectMemberRole = useMutation(
    trpc.projectPermissions.updateProjectMemberRole.mutationOptions(
      {
        onSuccess: async () => {
          toast.success("Member role updated successfully");
          await queryClient.invalidateQueries(
            trpc.projectPermissions.getProjectMembers.queryOptions(
              { projectId: id }
            )
          );
        },
        onError: (error) => {
          toast.error(
            error.message || "Failed to update member role"
          );
        },
      }
    )
  );

  const form = useAppForm({
    defaultValues: { name: project?.name || "" },
    validators: {
      onChange: Schema.standardSchemaV1(
        ProjectSettingsFormSchema
      ),
    },
    onSubmit: async ({ value }) => {
      try {
        await updateProjectName.mutateAsync({
          projectId: id,
          name: value.name,
        });
      } catch {
        // Error handled by mutation onError
      }
    },
  });

  // Handler functions for member management
  const handleAddMember = async (
    userId: string,
    role: ProjectRoleValue
  ) => {
    await addProjectMember.mutateAsync({
      projectId: id,
      userId,
      role,
    });
  };

  const handleRemoveMember = (userId: string) => {
    const member = projectMembers.find(
      (m) => m.id === userId
    );
    if (member) {
      setSelectedMember({
        id: member.id || "",
        name: member.name || "",
        email: member.email || "",
        image: member.image,
        role: member.role,
      });
      setShowRemoveMemberModal(true);
    }
  };

  const handleEditRole = (
    userId: string,
    currentRole: ProjectRoleValue
  ) => {
    const member = projectMembers.find(
      (m) => m.id === userId
    );
    if (member) {
      setSelectedMember({
        id: member.id || "",
        name: member.name || "",
        email: member.email || "",
        image: member.image,
        role: currentRole,
      });
      setShowEditRoleModal(true);
    }
  };

  const handleConfirmRemove = async () => {
    if (selectedMember) {
      await removeProjectMember.mutateAsync({
        projectId: id,
        userId: selectedMember.id,
      });
      setShowRemoveMemberModal(false);
      setSelectedMember(null);
    }
  };

  const handleConfirmRoleUpdate = async (
    newRole: ProjectRoleValue
  ) => {
    if (selectedMember) {
      await updateProjectMemberRole.mutateAsync({
        projectId: id,
        userId: selectedMember.id,
        role: newRole,
      });
      setSelectedMember(null);
    }
  };

  return (
    <AppLayout
      title={
        <>
          <Link
            to="/app/organization/$id"
            params={{ id: project?.organizationId || "" }}
            className="hover:underline"
          >
            {organizationData?.organization?.name ||
              "Organization"}
          </Link>
          {"/"}
          <Link
            to="/app/project/$id"
            params={{ id }}
            className="hover:underline"
          >
            {project?.name || "Project"}
          </Link>
          {"/"}
          <span>settings</span>
        </>
      }
      subtitle="Project Settings"
      description="Update your project's name and settings."
      headerActions={null}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-row items-end gap-2">
          <div className="flex flex-col flex-1">
            <FormInput
              form={form}
              name="name"
              label="Project Name"
              placeholder="Enter project name"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={
              form.state.isSubmitting ||
              updateProjectName.isPending
            }
            className="h-9"
          >
            {form.state.isSubmitting ||
            updateProjectName.isPending
              ? "Saving..."
              : "Save"}
          </Button>
        </div>
      </form>

      {/* Project Members Section */}
      <div className="mt-8 border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              Project Members
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage who has access to this project and
              their roles.
            </p>
          </div>
          <Button
            onClick={() => setShowAddMemberModal(true)}
            size="sm"
          >
            <IconUserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>

        <ProjectMembersTable
          members={projectMembers}
          onRemoveMember={handleRemoveMember}
          onEditRole={handleEditRole}
        />
      </div>

      {/* Danger Zone */}
      <div className="mt-8 border-t pt-6">
        <Card className="bg-destructive/5 ring-destructive/20 py-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete this project and all of its
              API keys and data. This action cannot be
              undone.
            </p>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDeleteDialog(true);
              }}
              disabled={deleteProject.isPending}
            >
              Delete Project
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteDialog(false);
            setConfirmationName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              This action will permanently delete your
              project, including all API keys and associated
              data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium mb-2">
                To confirm, type "{project?.name}" below:
              </p>
              <Input
                type="text"
                value={confirmationName}
                onChange={(e) => {
                  setConfirmationName(e.target.value);
                }}
                placeholder={project?.name}
                className="font-mono"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setConfirmationName("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteProject.mutate({
                    organizationId:
                      project?.organizationId || "",
                    projectId: id,
                    confirmationName,
                  });
                }}
                disabled={
                  confirmationName !== project?.name ||
                  deleteProject.isPending
                }
              >
                {deleteProject.isPending
                  ? "Deleting..."
                  : "Delete Project"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Member Modals */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        organizationMembers={organizationMembers}
        onAddMember={handleAddMember}
        isAdding={addProjectMember.isPending}
      />

      {selectedMember && (
        <>
          <RemoveMemberModal
            isOpen={showRemoveMemberModal}
            onClose={() => {
              setShowRemoveMemberModal(false);
              setSelectedMember(null);
            }}
            memberName={selectedMember.name}
            memberEmail={selectedMember.email}
            {...(selectedMember.image !== undefined && {
              memberImage: selectedMember.image,
            })}
            onConfirm={handleConfirmRemove}
            isRemoving={removeProjectMember.isPending}
          />

          <EditRoleModal
            isOpen={showEditRoleModal}
            onClose={() => {
              setShowEditRoleModal(false);
              setSelectedMember(null);
            }}
            memberName={selectedMember.name}
            memberEmail={selectedMember.email}
            {...(selectedMember.image !== undefined && {
              memberImage: selectedMember.image,
            })}
            currentRole={selectedMember.role}
            onUpdateRole={handleConfirmRoleUpdate}
            isUpdating={updateProjectMemberRole.isPending}
          />
        </>
      )}
    </AppLayout>
  );
}

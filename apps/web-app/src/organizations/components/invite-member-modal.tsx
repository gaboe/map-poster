import { useState } from "react";
import {
  useMutation,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useTRPC } from "@/infrastructure/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Badge } from "@/shared/ui/badge";
import { toast } from "sonner";
import { InputTags } from "@/shared/ui/input-tags";
import { ProjectRoleSelector } from "./project-role-selector";
import {
  Copy,
  CheckCircle,
  XCircle,
  Crown,
} from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onInviteSuccess?: () => void;
};

type InvitationResult = {
  email: string;
  success: boolean;
  invitationId?: string;
  error?: string;
};

type ProjectRoleAssignment = {
  projectId: string;
  role: string | null;
};

export function InviteMemberModal({
  isOpen,
  onClose,
  organizationId,
  onInviteSuccess,
}: Props) {
  const [emails, setEmails] = useState<string[]>([]);
  const [organizationRole, setOrganizationRole] = useState<
    "member" | "admin" | "owner"
  >("member");
  const [projectAssignments, setProjectAssignments] =
    useState<ProjectRoleAssignment[]>([]);
  const [invitationResults, setInvitationResults] =
    useState<InvitationResult[] | null>(null);

  const trpc = useTRPC();

  // Check if selected organization role is admin or owner
  const isOrgAdmin =
    organizationRole === "admin" ||
    organizationRole === "owner";

  // Fetch organization projects for project assignment
  const { data: organizationData } = useSuspenseQuery(
    trpc.projectPermissions.getOrganizationMembersWithAllProjectPermissions.queryOptions(
      { organizationId }
    )
  );

  const createBulkInvitations = useMutation(
    trpc.organizationInvitations.createBulkInvitations.mutationOptions(
      {
        onSuccess: (data) => {
          const successCount = data.results.filter(
            (r) => r.success
          ).length;
          const failureCount = data.results.filter(
            (r) => !r.success
          ).length;

          if (successCount > 0) {
            toast.success(
              `${successCount} invitation${successCount > 1 ? "s" : ""} created successfully!`
            );
          }

          if (failureCount > 0) {
            toast.error(
              `${failureCount} invitation${failureCount > 1 ? "s" : ""} failed`
            );
          }

          setInvitationResults(data.results);
          onInviteSuccess?.();
        },
        onError: (error) => {
          toast.error(
            error.message || "Failed to create invitations"
          );
        },
      }
    )
  );

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (emails.length === 0) {
      toast.error(
        "Please enter at least one email address"
      );
      return;
    }

    // Prepare project assignments for the mutation
    const projectAssignmentsForMutation = projectAssignments
      .filter(
        (assignment) =>
          assignment.role !== null &&
          assignment.role !== "none"
      )
      .map((assignment) => ({
        projectId: assignment.projectId,
        role: assignment.role as
          | "viewer"
          | "editor"
          | "admin",
      }));

    createBulkInvitations.mutate({
      emails,
      organizationId,
      organizationRole,
      projectAssignments:
        projectAssignmentsForMutation.length > 0
          ? projectAssignmentsForMutation
          : undefined,
    });
  };

  const handleProjectRoleChange = (
    projectId: string,
    role: string | null
  ) => {
    setProjectAssignments((prev) => {
      const existing = prev.find(
        (a) => a.projectId === projectId
      );
      if (existing) {
        return prev.map((a) =>
          a.projectId === projectId ? { ...a, role } : a
        );
      }
      return [...prev, { projectId, role }];
    });
  };

  const handleClose = () => {
    setEmails([]);
    setOrganizationRole("member");
    setProjectAssignments([]);
    if (invitationResults) {
      onInviteSuccess?.();
    }
    setInvitationResults(null);
    onClose();
  };

  const copyInvitationLink = (invitationId: string) => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "";
    const invitationLink = `${baseUrl}/invitations/${invitationId}`;
    void navigator.clipboard.writeText(invitationLink);
    toast.success("Invitation link copied to clipboard!");
  };

  const copyAllSuccessfulLinks = () => {
    if (!invitationResults) return;

    const successfulResults = invitationResults.filter(
      (r) => r.success && r.invitationId
    );
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "";
    const links = successfulResults
      .map(
        (r) =>
          `${r.email}: ${baseUrl}/invitations/${r.invitationId}`
      )
      .join("\n");

    void navigator.clipboard.writeText(links);
    toast.success(
      "All invitation links copied to clipboard!"
    );
  };

  // Results view after bulk invitations are processed
  if (invitationResults) {
    const successfulResults = invitationResults.filter(
      (r) => r.success
    );
    const failedResults = invitationResults.filter(
      (r) => !r.success
    );

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invitation Results</DialogTitle>
            <DialogDescription>
              {successfulResults.length > 0 &&
                `${successfulResults.length} invitation${successfulResults.length > 1 ? "s" : ""} created successfully. `}
              {failedResults.length > 0 &&
                `${failedResults.length} invitation${failedResults.length > 1 ? "s" : ""} failed.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {successfulResults.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-medium text-green-700">
                    Successful Invitations (
                    {successfulResults.length})
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyAllSuccessfulLinks}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All Links
                  </Button>
                </div>
                <div className="space-y-2">
                  {successfulResults.map((result) => (
                    <Card
                      key={result.email}
                      className="bg-green-50 ring-green-200 py-0 dark:bg-green-950 dark:ring-green-800"
                    >
                      <CardContent className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium">
                            {result.email}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyInvitationLink(
                              result.invitationId!
                            )
                          }
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Link
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {failedResults.length > 0 && (
              <div>
                <Label className="text-base font-medium text-red-700">
                  Failed Invitations ({failedResults.length}
                  )
                </Label>
                <div className="space-y-2 mt-3">
                  {failedResults.map((result) => (
                    <Card
                      key={result.email}
                      className="bg-red-50 ring-red-200 py-0 dark:bg-red-950 dark:ring-red-800"
                    >
                      <CardContent className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="font-medium">
                            {result.email}
                          </span>
                        </div>
                        <Badge
                          variant="destructive"
                          className="text-xs"
                        >
                          {result.error}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Card className="bg-muted/50 py-0">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Tip:</strong> Send these links
                  manually via email, Slack, or any other
                  communication method. Recipients can click
                  the links to join the organization.
                </p>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Main invitation form
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Invite multiple members to join this
            organization. Enter email addresses and
            optionally assign project permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Email Addresses</Label>
            <InputTags
              type="email"
              value={emails}
              onChange={setEmails}
              placeholder="Enter email addresses separated by commas"
              disabled={createBulkInvitations.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Supports comma, semicolon, and space
              separators. Duplicate emails will be
              automatically removed.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Organization Role</Label>
            <Select
              value={organizationRole}
              onValueChange={(value) => {
                const newRole = value as
                  | "member"
                  | "admin"
                  | "owner";
                setOrganizationRole(newRole);

                // Auto-populate all projects with admin role when org admin/owner is selected
                if (
                  newRole === "admin" ||
                  newRole === "owner"
                ) {
                  setProjectAssignments(
                    organizationData.projects.map(
                      (project) => ({
                        projectId: project.id,
                        role: "admin",
                      })
                    )
                  );
                } else {
                  // Clear project assignments when switching back to member
                  setProjectAssignments([]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue>
                  {organizationRole === "member"
                    ? "Member"
                    : organizationRole === "admin"
                      ? "Admin"
                      : "Owner"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">
                  Member
                </SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">
                Project Permissions (Optional)
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Assign project roles to all invited users.
                Organization admins automatically get admin
                access to all projects.
              </p>
            </div>

            {isOrgAdmin && (
              <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 ring-orange-200 py-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-900">
                      Organization {organizationRole}
                    </span>
                  </div>
                  <p className="text-sm text-orange-800">
                    This user automatically has admin access
                    to all projects in this organization.
                  </p>
                </CardContent>
              </Card>
            )}

            <ProjectRoleSelector
              projects={organizationData.projects}
              projectRoleAssignments={projectAssignments}
              onProjectRoleChange={handleProjectRoleChange}
              disabled={
                createBulkInvitations.isPending ||
                isOrgAdmin
              }
              isOrgAdmin={isOrgAdmin}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createBulkInvitations.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createBulkInvitations.isPending ||
                emails.length === 0
              }
            >
              {createBulkInvitations.isPending
                ? "Creating Invitations..."
                : `Invite ${emails.length} Member${emails.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

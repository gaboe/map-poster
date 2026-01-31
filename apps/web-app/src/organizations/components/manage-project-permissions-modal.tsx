import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { ProjectRoles } from "@map-poster/common";
import { MemberAvatar } from "@/shared/ui/member-avatar";
import { Card, CardContent } from "@/shared/ui/card";
import { Shield, Eye, Edit3, Crown, X } from "lucide-react";

type ProjectPermission = {
  projectId: string;
  projectName: string;
  role: string | null;
  hasAccess: boolean;
  effectiveRole?: string;
};

type Project = {
  id: string;
  name: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  organizationRole: string;
  projectPermissions: ProjectPermission[];
  projects: Project[];
  onUpdateProjectRole: (
    projectId: string,
    role: string | null
  ) => void;
};

export function ManageProjectPermissionsModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  userImage,
  organizationRole,
  projectPermissions,
  projects,
  onUpdateProjectRole,
}: Props) {
  const isOrgAdmin =
    organizationRole === "admin" ||
    organizationRole === "owner";

  const handleRoleChange = (
    projectId: string,
    newRole: string | null
  ) => {
    // Apply change immediately
    onUpdateProjectRole(projectId, newRole);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Manage Project Permissions
          </DialogTitle>
          <DialogDescription>
            Configure project-level access for this
            organization member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member Info */}
          <Card className="bg-muted/20 py-0">
            <CardContent className="p-4 flex items-center gap-3">
              <MemberAvatar
                name={userName}
                {...(userImage !== undefined && {
                  image: userImage,
                })}
              />
              <div>
                <div className="font-medium">
                  {userName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {userEmail}
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs mt-1"
                >
                  Organization {organizationRole}
                </Badge>
              </div>
            </CardContent>
          </Card>

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

          {/* Project Permissions */}
          <div className="space-y-3">
            <h4 className="font-medium">
              Project Permissions
            </h4>
            {projects.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No projects in this organization yet.
              </p>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => {
                  const currentPermission =
                    projectPermissions.find(
                      (p) => p.projectId === project.id
                    );
                  const displayRole =
                    currentPermission?.role;

                  return (
                    <Card
                      key={project.id}
                      className="py-0 transition-colors hover:bg-muted/20 hover:ring-primary/20"
                    >
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <span className="font-medium">
                            {project.name}
                          </span>
                        </div>

                        <div className="w-40">
                          {isOrgAdmin ? (
                            <Badge
                              variant="secondary"
                              className="text-xs flex items-center gap-1 justify-center"
                            >
                              <Crown className="h-3 w-3" />
                              Auto admin
                            </Badge>
                          ) : (
                            <Select
                              value={displayRole || "none"}
                              onValueChange={(value) =>
                                handleRoleChange(
                                  project.id,
                                  value === "none"
                                    ? null
                                    : value
                                )
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  <span className="flex items-center gap-2">
                                    <X className="h-4 w-4 text-gray-500" />
                                    No access
                                  </span>
                                </SelectItem>
                                <SelectItem
                                  value={
                                    ProjectRoles.Viewer
                                  }
                                >
                                  <span className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-green-500" />
                                    Viewer
                                  </span>
                                </SelectItem>
                                <SelectItem
                                  value={
                                    ProjectRoles.Editor
                                  }
                                >
                                  <span className="flex items-center gap-2">
                                    <Edit3 className="h-4 w-4 text-blue-500" />
                                    Editor
                                  </span>
                                </SelectItem>
                                <SelectItem
                                  value={ProjectRoles.Admin}
                                >
                                  <span className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-red-500" />
                                    Admin
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

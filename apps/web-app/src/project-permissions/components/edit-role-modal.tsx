import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import {
  ProjectRoles,
  type ProjectRoleValue,
} from "@map-poster/common";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberEmail: string;
  memberImage?: string | null;
  currentRole: ProjectRoleValue;
  onUpdateRole: (
    newRole: ProjectRoleValue
  ) => Promise<void>;
  isUpdating?: boolean;
};

function getRoleDisplayName(role: string) {
  switch (role) {
    case ProjectRoles.Admin:
      return "Admin";
    case ProjectRoles.Editor:
      return "Editor";
    case ProjectRoles.Viewer:
      return "Viewer";
    default:
      return role;
  }
}

export function EditRoleModal({
  isOpen,
  onClose,
  memberName,
  memberEmail,
  memberImage,
  currentRole,
  onUpdateRole,
  isUpdating = false,
}: Props) {
  const [selectedRole, setSelectedRole] =
    useState<ProjectRoleValue>(currentRole);

  const handleSubmit = async () => {
    if (selectedRole === currentRole) {
      onClose();
      return;
    }

    try {
      await onUpdateRole(selectedRole);
      onClose();
    } catch {
      // Error handling is done in the parent component
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Member Role</DialogTitle>
          <DialogDescription>
            Update this member's role and permissions for
            this project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Member Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">
              Member:
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={memberImage || undefined}
                />
                <AvatarFallback className="text-xs">
                  {memberName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">
                  {memberName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {memberEmail}
                </div>
              </div>
              <Badge variant="outline">
                Current: {getRoleDisplayName(currentRole)}
              </Badge>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              New Role
            </label>
            <Select
              value={selectedRole}
              onValueChange={(value) =>
                setSelectedRole(value as ProjectRoleValue)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ProjectRoles.Viewer}>
                  <div>
                    <div className="font-medium">
                      Viewer
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Read-only access to project
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value={ProjectRoles.Editor}>
                  <div>
                    <div className="font-medium">
                      Editor
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Can read and modify project
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value={ProjectRoles.Admin}>
                  <div>
                    <div className="font-medium">Admin</div>
                    <div className="text-xs text-muted-foreground">
                      Full control over project
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Role Change Preview */}
          {selectedRole !== currentRole && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Role Change:
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-200">
                {getRoleDisplayName(currentRole)} →{" "}
                {getRoleDisplayName(selectedRole)}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update Role"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

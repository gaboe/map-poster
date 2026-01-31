import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { ProjectRoles } from "@map-poster/common";
import { Shield, Eye, Edit3, X, Crown } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";

type ProjectRoleAssignment = {
  projectId: string;
  role: string | null;
};

type Project = {
  id: string;
  name: string;
};

type Props = {
  projects: Project[];
  projectRoleAssignments: ProjectRoleAssignment[];
  onProjectRoleChange: (
    projectId: string,
    role: string | null
  ) => void;
  disabled?: boolean;
  isOrgAdmin?: boolean;
};

export function ProjectRoleSelector({
  projects,
  projectRoleAssignments,
  onProjectRoleChange,
  disabled = false,
  isOrgAdmin = false,
}: Props) {
  if (projects.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No projects in this organization yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => {
        const currentAssignment =
          projectRoleAssignments.find(
            (a) => a.projectId === project.id
          );
        const selectedRole =
          currentAssignment?.role || "none";

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
                    value={selectedRole}
                    onValueChange={(value) =>
                      onProjectRoleChange(
                        project.id,
                        value === "none" ? null : value
                      )
                    }
                    disabled={disabled}
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
                        value={ProjectRoles.Viewer}
                      >
                        <span className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-green-500" />
                          Viewer
                        </span>
                      </SelectItem>
                      <SelectItem
                        value={ProjectRoles.Editor}
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
  );
}

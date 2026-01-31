import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  IconDots,
  IconUserMinus,
  IconEdit,
} from "@tabler/icons-react";
import {
  ProjectRoles,
  type ProjectRoleValue,
} from "@map-poster/common";
import type { RouterOutputs } from "@/infrastructure/trpc/router";

type ProjectMember =
  RouterOutputs["projectPermissions"]["getProjectMembers"][0];

type Props = {
  members: ProjectMember[];
  onRemoveMember: (userId: string) => void;
  onEditRole: (
    userId: string,
    role: ProjectRoleValue
  ) => void;
  isLoading?: boolean;
};

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case ProjectRoles.Admin:
      return "destructive" as const;
    case ProjectRoles.Editor:
      return "default" as const;
    case ProjectRoles.Viewer:
      return "secondary" as const;
    default:
      return "secondary" as const;
  }
}

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

export function ProjectMembersTable({
  members,
  onRemoveMember,
  onEditRole,
  isLoading = false,
}: Props) {
  if (isLoading) {
    return (
      <Card className="py-0">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            Loading members...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card className="py-0">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground mb-2">
            No project members
          </div>
          <div className="text-sm text-muted-foreground">
            Add members to give them access to this project
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={member.image || undefined}
                      />
                      <AvatarFallback className="text-xs">
                        {member.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {member.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.email || ""}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getRoleBadgeVariant(
                      member.role
                    )}
                  >
                    {getRoleDisplayName(member.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {new Date(
                      member.createdAt
                    ).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        />
                      }
                    >
                      <IconDots className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          onEditRole(
                            member.id || "",
                            member.role
                          )
                        }
                      >
                        <IconEdit className="h-4 w-4 mr-2" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onRemoveMember(member.id || "")
                        }
                        className="text-destructive"
                      >
                        <IconUserMinus className="h-4 w-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

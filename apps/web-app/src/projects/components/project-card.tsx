import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Link } from "@tanstack/react-router";
import {
  IconSettings,
  IconAlertTriangle,
} from "@tabler/icons-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

export interface Props {
  project: {
    id: string;
    name: string;
  };
  disabled?: boolean;
}

export function ProjectCard({
  project,
  disabled = false,
}: Props) {
  if (disabled) {
    return (
      <Card className="min-w-[140px] flex flex-col justify-between py-0">
        <CardContent className="p-2">
          <div className="flex items-center gap-2">
            <div className="truncate text-base font-semibold">
              {project.name}
            </div>
            <Tooltip>
              <TooltipTrigger
                render={
                  <IconAlertTriangle className="size-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                }
              />
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">
                    Member Access Only
                  </p>
                  <p className="text-xs mt-1">
                    Contact an admin for project access
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center justify-between gap-1 mt-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="flex-1 py-1 px-2 text-sm"
            >
              Go to project
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="p-1"
              disabled
            >
              <IconSettings className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-[140px] flex flex-col justify-between py-0 transition hover:bg-muted/20">
      <CardContent className="p-2">
        <div className="flex items-center gap-1">
          <div className="truncate text-base font-semibold">
            {project.name}
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 mt-2">
          <Link
            to="/app/project/$id"
            params={{ id: project.id }}
            className="w-full"
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full group-hover:bg-primary group-hover:text-white transition-colors py-1 px-2 text-sm"
            >
              Go to project
            </Button>
          </Link>
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  to="/app/project/$id/settings"
                  params={{ id: project.id }}
                  className="ml-1"
                />
              }
            >
              <Button
                variant="ghost"
                size="icon"
                className="p-1"
              >
                <IconSettings className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Project Settings
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}

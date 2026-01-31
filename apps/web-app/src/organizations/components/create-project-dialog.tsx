import { useTRPC } from "@/infrastructure/trpc/react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useAppForm } from "@/shared/forms/form-context";
import { Schema } from "effect";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { FormInput } from "@/shared/forms/form-input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { CreateButton } from "@/shared/ui/create-button";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

interface CreateProjectDialogProps {
  organizationId: string;
}

export function CreateProjectDialog({
  organizationId,
}: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Mutation for creating project
  const createProject = useMutation(
    trpc.project.createProject.mutationOptions({
      onSuccess: async (data) => {
        setOpen(false);
        await queryClient.invalidateQueries(
          trpc.organization.getOrganizationsDetails.queryOptions()
        );
        // Navigate to project detail page after creation
        if (data.project) {
          void navigate({
            to: "/app/project/$id",
            params: { id: data.project.id },
          });
        }
      },
      onError: (error) => {
        console.error("Project creation failed:", error);
      },
    })
  );

  // Form for project creation using Effect Schema
  const projectSchema = Schema.Struct({
    name: Schema.String.pipe(
      Schema.minLength(3, {
        message: () => "Project name is required",
      })
    ),
  });
  const form = useAppForm({
    defaultValues: { name: "" },
    validators: {
      onChange: Schema.standardSchemaV1(projectSchema),
    },
    onSubmit: async ({ value }) => {
      await createProject.mutateAsync({
        name: value.name,
        organizationId,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              render={
                <CreateButton
                  title="New Project"
                  size="sm"
                />
              }
            />
          }
        />
        <TooltipContent>Create new project</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await form.handleSubmit();
          }}
          className="space-y-4"
        >
          <FormInput
            form={form}
            name="name"
            label="Project Name"
            placeholder="Enter project name"
            required
          />
          <DialogFooter>
            <Button
              type="submit"
              disabled={
                form.state.isSubmitting ||
                createProject.isPending
              }
            >
              {form.state.isSubmitting ||
              createProject.isPending
                ? "Creating..."
                : "Create"}
            </Button>
            <DialogClose
              render={
                <Button type="button" variant="ghost" />
              }
            >
              Cancel
            </DialogClose>
          </DialogFooter>
          {createProject.error && (
            <div className="text-destructive text-xs text-center">
              {createProject.error.message}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

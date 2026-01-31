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
import { CreateButton } from "@/shared/ui/create-button";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

// Form validation schema for organization creation
const CreateOrgFormSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(3, {
      message: () => "Organization name is required",
    })
  ),
});

export function CreateOrganizationDialog() {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Mutation for creating organization
  const createOrganization = useMutation(
    trpc.organization.createOrganization.mutationOptions({
      onSuccess: async (data) => {
        setOpen(false);
        await queryClient.invalidateQueries(
          trpc.organization.getOrganizationsDetails.queryOptions()
        );
        // Navigate to organization detail page after creation
        if (data.organization) {
          void navigate({
            to: "/app/organization/$id",
            params: { id: data.organization.id },
          });
        }
      },
    })
  );

  // Form for organization creation
  const form = useAppForm({
    defaultValues: { name: "" },
    validators: {
      onChange: Schema.standardSchemaV1(
        CreateOrgFormSchema
      ),
    },
    onSubmit: async ({ value }) => {
      await createOrganization.mutateAsync({
        name: value.name,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<CreateButton title="New Organization" />}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
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
            label="Organization Name"
            placeholder="Enter organization name"
            required
          />
          <DialogFooter>
            <Button
              type="submit"
              disabled={
                form.state.isSubmitting ||
                createOrganization.isPending
              }
            >
              {form.state.isSubmitting ||
              createOrganization.isPending
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
          {createOrganization.error && (
            <div className="text-destructive text-xs text-center">
              {createOrganization.error.message}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

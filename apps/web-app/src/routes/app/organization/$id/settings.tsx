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

const OrgSettingsFormSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(3, {
      message: () => "Organization name is required",
    })
  ),
});

export const Route = createFileRoute(
  "/app/organization/$id/settings"
)({
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.organization.getById.queryOptions({
        organizationId: params.id,
      })
    );
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
  const { data } = useSuspenseQuery(
    trpc.organization.getById.queryOptions({
      organizationId: id,
    })
  );
  const organization = data?.organization;

  const setOrganizationName = useMutation(
    trpc.organization.setOrganizationName.mutationOptions({
      onSuccess: async () => {
        toast.success("Organization name saved!");
        await queryClient.invalidateQueries(
          trpc.organization.getOrganizationsDetails.queryOptions()
        );
        await queryClient.invalidateQueries(
          trpc.organization.getById.queryOptions({
            organizationId: id,
          })
        );
      },
      onError: (error) => {
        toast.error(
          error.message ||
            "Failed to save organization name."
        );
      },
    })
  );

  const deleteOrganization = useMutation(
    trpc.organization.deleteOrganization.mutationOptions({
      onSuccess: async () => {
        toast.success("Organization deleted successfully");
        await queryClient.invalidateQueries(
          trpc.organization.getUserOrganizations.queryOptions()
        );
        await queryClient.invalidateQueries(
          trpc.organization.getOrganizationsDetails.queryOptions()
        );
        // Navigate to organizations list or dashboard
        void navigate({ to: "/app" });
      },
      onError: (error) => {
        toast.error(
          error.message || "Failed to delete organization"
        );
      },
    })
  );

  const form = useAppForm({
    defaultValues: { name: organization?.name || "" },
    validators: {
      onChange: Schema.standardSchemaV1(
        OrgSettingsFormSchema
      ),
    },
    onSubmit: async ({ value }) => {
      try {
        await setOrganizationName.mutateAsync({
          organizationId: id,
          name: value.name,
        });
      } catch {
        // setSuccess(false); // Removed as per edit hint
      }
    },
  });

  return (
    <AppLayout
      title={
        <Link
          to="/app/organization/$id"
          params={{ id }}
          className="hover:underline"
        >
          {organization?.name}
        </Link>
      }
      subtitle="Organization Settings"
      description=""
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
              label="Organization Name"
              placeholder="Enter organization name"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={
              form.state.isSubmitting ||
              setOrganizationName.isPending
            }
            className="h-9"
          >
            {form.state.isSubmitting ||
            setOrganizationName.isPending
              ? "Saving..."
              : "Save"}
          </Button>
        </div>
        {/* Removed inline success/error messages, handled by toast */}
      </form>

      {/* Danger Zone */}
      <div className="mt-8 border-t pt-6">
        <Card className="bg-destructive/5 ring-destructive/20 py-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete this organization and all
              of its projects, API keys, and data. This
              action cannot be undone.
            </p>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDeleteDialog(true);
              }}
              disabled={deleteOrganization.isPending}
            >
              Delete Organization
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
            <DialogTitle>Delete Organization</DialogTitle>
            <DialogDescription>
              This action will permanently delete your
              organization, including all projects, API
              keys, integrations, and associated data. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium mb-2">
                To confirm, type "{organization?.name}"
                below:
              </p>
              <Input
                type="text"
                value={confirmationName}
                onChange={(e) => {
                  setConfirmationName(e.target.value);
                }}
                placeholder={organization?.name}
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
                  deleteOrganization.mutate({
                    organizationId: id,
                    confirmationName,
                  });
                }}
                disabled={
                  confirmationName !== organization?.name ||
                  deleteOrganization.isPending
                }
              >
                {deleteOrganization.isPending
                  ? "Deleting..."
                  : "Delete Organization"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

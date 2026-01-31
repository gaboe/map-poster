import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useTRPC } from "@/infrastructure/trpc/react";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { InvitationDetails } from "./invitation-details";

export function PendingInvitationModal() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(true);

  // Get pending invitations for the current user
  const { data: invitations = [], refetch } =
    useSuspenseQuery(
      trpc.organizationInvitations.getPendingInvitationsForUser.queryOptions()
    );

  // Get the first invitation to show
  const currentInvitation = invitations[0];

  const isOpen = !!currentInvitation && isModalOpen;

  // Reset modal open state when invitations change
  useEffect(() => {
    if (currentInvitation) {
      setIsModalOpen(true);
    }
  }, [currentInvitation?.id]);

  const acceptInvitation = useMutation(
    trpc.organizationInvitations.acceptInvitation.mutationOptions(
      {
        onSuccess: async (data) => {
          if (!data.success) {
            // Handle expected business cases (not errors)
            const messages = {
              not_found:
                "This invitation is no longer valid or has already been used.",
              expired: "This invitation has expired.",
              email_mismatch:
                "This invitation was sent to a different email address.",
            } as const;
            toast.error(messages[data.reason]);
            void refetch(); // Refresh invitations list to remove invalid invitation
            return;
          }

          toast.success(
            "Successfully joined the organization!"
          );
          // Invalidate organization queries to refresh sidebar
          await queryClient.invalidateQueries(
            trpc.organization.getOrganizationsDetails.queryOptions()
          );
          void refetch(); // Refresh invitations list
          void navigate({
            to: "/app/organization/$id",
            params: { id: data.organizationId },
          });
        },
        onError: (error) => {
          toast.error(
            error.message || "Failed to accept invitation"
          );
        },
      }
    )
  );

  const dismissInvitation = useMutation(
    trpc.organizationInvitations.dismissInvitation.mutationOptions(
      {
        onSuccess: () => {
          toast.info("Invitation dismissed");
          void refetch(); // Refresh invitations list
        },
        onError: (error) => {
          toast.error(
            error.message || "Failed to dismiss invitation"
          );
        },
      }
    )
  );

  const handleAccept = () => {
    if (currentInvitation) {
      acceptInvitation.mutate({
        invitationId: currentInvitation.id,
      });
    }
  };

  const handleDecline = () => {
    if (currentInvitation) {
      dismissInvitation.mutate({
        invitationId: currentInvitation.id,
      });
    }
  };

  const handleClose = () => {
    // Just close the modal without dismissing the invitation
    // User can refresh to see the invitation again
    // Only explicit "Dismiss" button should dismiss the invitation
    setIsModalOpen(false);
  };

  if (!currentInvitation || !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Organization Invitation</DialogTitle>
          <DialogDescription>
            You've been invited to join an organization.
          </DialogDescription>
        </DialogHeader>

        <InvitationDetails
          invitation={currentInvitation}
          onAccept={handleAccept}
          onDecline={handleDecline}
          isAccepting={
            acceptInvitation.isPending ||
            dismissInvitation.isPending
          }
          additionalInfo={
            invitations.length > 1 ? (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  You have {invitations.length} pending
                  invitations. They will be shown one by
                  one.
                </p>
              </div>
            ) : undefined
          }
          actionButtons={
            <DialogFooter>
              <div className="flex space-x-2 w-full">
                <Button
                  variant="outline"
                  onClick={handleDecline}
                  disabled={
                    acceptInvitation.isPending ||
                    dismissInvitation.isPending
                  }
                  className="flex-1"
                >
                  Dismiss
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={
                    acceptInvitation.isPending ||
                    dismissInvitation.isPending
                  }
                  className="flex-1"
                >
                  {acceptInvitation.isPending
                    ? "Accepting..."
                    : "Accept Invitation"}
                </Button>
              </div>
            </DialogFooter>
          }
        />
      </DialogContent>
    </Dialog>
  );
}

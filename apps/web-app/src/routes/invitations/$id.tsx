import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useTRPC } from "@/infrastructure/trpc/react";
import { PublicLayout } from "@/shared/layout/public-layout";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { toast } from "sonner";
import { authClient } from "@/auth/auth-client";
import { useEffect, useEffectEvent } from "react";
import { useUserInfo } from "@/hooks/users/use-user-info";
import { InvitationDetails } from "@/dashboard/invitation-details";

export const Route = createFileRoute("/invitations/$id")({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.prefetchQuery(
        context.trpc.organizationInvitations.getInvitationDetails.queryOptions(
          {
            invitationId: params.id,
          }
        )
      );
    } catch (error) {
      // If invitation doesn't exist, continue anyway - we'll handle this in the component
      console.warn("Failed to prefetch invitation:", error);
    }
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
  const navigate = useNavigate();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Get current user info
  const { data: userInfo } = useUserInfo();

  const {
    data: invitation,
    isLoading,
    error,
  } = useQuery(
    trpc.organizationInvitations.getInvitationDetails.queryOptions(
      {
        invitationId: id,
      }
    )
  );

  // Effect event for navigation - doesn't need to trigger effect re-runs
  const onValidInvitation = useEffectEvent(() => {
    void navigate({ to: "/app/dashboard" });
  });

  // If user is logged in and invitation is valid, redirect to dashboard
  useEffect(() => {
    if (userInfo && invitation && !error) {
      const userEmail = userInfo.email;
      const isCorrectUser = userEmail === invitation.email;
      const isExpired =
        new Date(invitation.expiresAt) < new Date();

      // Only redirect if user email matches and invitation is not expired
      if (isCorrectUser && !isExpired) {
        // User will see the invitation modal on dashboard
        onValidInvitation();
      }
    }
  }, [userInfo, invitation, error]);

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
            return;
          }

          toast.success(
            "Successfully joined the organization!"
          );
          // Invalidate organization queries to refresh sidebar
          await queryClient.invalidateQueries(
            trpc.organization.getOrganizationsDetails.queryOptions()
          );
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

  const handleAcceptInvitation = () => {
    if (!userInfo) {
      // User needs to be logged in to accept invitation
      toast.error(
        "Please log in to accept this invitation"
      );
      return;
    }

    acceptInvitation.mutate({ invitationId: id });
  };

  const handleDeclineInvitation = () => {
    void navigate({ to: "/app/dashboard" });
  };

  if (isLoading) {
    return (
      <PublicLayout
        title="Invitation"
        subtitle="Loading Invitation..."
        description="Loading invitation details..."
      >
        <div className="text-center">
          <p className="text-muted-foreground">
            Loading invitation...
          </p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !invitation) {
    return (
      <PublicLayout
        title="Invitation"
        subtitle="Invitation Not Found"
        description="This invitation link is invalid or has expired."
      >
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            The invitation you're looking for doesn't exist
            or has expired.
          </p>
          <Button
            onClick={() => void navigate({ to: "/" })}
          >
            Go to Home
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const isExpired =
    new Date(invitation.expiresAt) < new Date();
  const userEmail = userInfo?.email;
  const isCorrectUser = userEmail === invitation.email;
  const hasAccount = !!userInfo;

  return (
    <PublicLayout title="Invitation">
      <div className="max-w-2xl mx-auto">
        <Card className="py-0">
          <CardContent className="p-6">
            <InvitationDetails
              invitation={invitation}
              onAccept={handleAcceptInvitation}
              onDecline={handleDeclineInvitation}
              isAccepting={acceptInvitation.isPending}
              showExpired={true}
              actionButtons={
                !hasAccount ? (
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-md">
                      <p className="text-sm">
                        You need an account to accept this
                        invitation. You can sign in if you
                        already have an account, or create a
                        new account.
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          void navigate({
                            to: "/sign-up",
                            search: {
                              email: invitation.email,
                            },
                          });
                        }}
                        className="flex-1"
                      >
                        Create Account
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          void navigate({ to: "/sign-in" });
                        }}
                        className="flex-1"
                      >
                        Sign In
                      </Button>
                    </div>
                  </div>
                ) : isExpired ? (
                  <div className="space-y-4">
                    <div className="bg-destructive/10 p-4 rounded-md">
                      <p className="text-sm text-destructive">
                        This invitation has expired and can
                        no longer be accepted.
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        void navigate({
                          to: "/app/dashboard",
                        })
                      }
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                ) : !isCorrectUser ? (
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-md">
                      <p className="text-sm">
                        This invitation was sent to{" "}
                        <strong>{invitation.email}</strong>,
                        but you're logged in as{" "}
                        <strong>{userEmail}</strong>. You
                        need to sign in with the correct
                        account to accept this invitation.
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          void authClient.signOut();
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Sign In as {invitation.email}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDeclineInvitation}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleAcceptInvitation}
                      disabled={acceptInvitation.isPending}
                      className="flex-1"
                    >
                      {acceptInvitation.isPending
                        ? "Accepting..."
                        : "Accept Invitation"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDeclineInvitation}
                      disabled={acceptInvitation.isPending}
                      className="flex-1"
                    >
                      Decline
                    </Button>
                  </div>
                )
              }
            />
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}

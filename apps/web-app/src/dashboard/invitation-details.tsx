import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

type InvitationData = {
  id: string;
  email: string;
  role: string | null;
  organizationName: string | null;
  inviterName: string | null;
  inviterEmail: string | null;
  expiresAt: string | Date;
};

type Props = {
  invitation: InvitationData;
  onAccept: () => void;
  onDecline: () => void;
  isAccepting?: boolean;
  showExpired?: boolean;
  additionalInfo?: React.ReactNode;
  actionButtons?: React.ReactNode;
};

export function InvitationDetails({
  invitation,
  onAccept,
  onDecline,
  isAccepting = false,
  showExpired = false,
  additionalInfo,
  actionButtons,
}: Props) {
  const isExpired =
    new Date(invitation.expiresAt) < new Date();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          You're invited to join{" "}
          {invitation.organizationName || "an organization"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {invitation.inviterName || "Someone"} (
          {invitation.inviterEmail || "unknown"}) has
          invited you to join their organization.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-medium">Organization:</span>
          <span>
            {invitation.organizationName || "Unknown"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">Your role:</span>
          <Badge variant="secondary">
            {invitation.role || "member"}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">
            Invited email:
          </span>
          <span>{invitation.email}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">Expires:</span>
          <span
            className={
              showExpired && isExpired
                ? "text-destructive"
                : ""
            }
          >
            {new Date(
              invitation.expiresAt
            ).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {additionalInfo}

      {actionButtons || (
        <div className="flex space-x-2 w-full">
          <Button
            variant="outline"
            onClick={onDecline}
            disabled={isAccepting}
            className="flex-1"
          >
            Decline
          </Button>
          <Button
            onClick={onAccept}
            disabled={isAccepting}
            className="flex-1"
          >
            {isAccepting
              ? "Accepting..."
              : "Accept Invitation"}
          </Button>
        </div>
      )}
    </div>
  );
}

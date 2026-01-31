import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { toast } from "sonner";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  invitationId: string;
  email: string;
};

export function ShowInvitationLinkModal({
  isOpen,
  onClose,
  invitationId,
  email,
}: Props) {
  const invitationLink = `${typeof window !== "undefined" ? window.location.origin : ""}/invitations/${invitationId}`;

  const copyToClipboard = () => {
    if (typeof window !== "undefined") {
      void navigator.clipboard.writeText(invitationLink);
      toast.success("Invitation link copied to clipboard!");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Invitation Link</DialogTitle>
          <DialogDescription>
            Share this link with the person you want to
            invite to the organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Invitation Link</Label>
            <div className="flex mt-1 space-x-2">
              <Input
                value={invitationLink}
                readOnly
                className="flex-1 font-mono text-sm break-all"
              />
              <Button
                type="button"
                variant="outline"
                onClick={copyToClipboard}
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> Send this link to{" "}
              <strong>{email}</strong> manually via email,
              Slack, or any other communication method. They
              can click the link to join the organization.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

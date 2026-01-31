import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/ui/avatar";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberEmail: string;
  memberImage?: string | null;
  onConfirm: () => void;
  isRemoving?: boolean;
};

export function RemoveMemberModal({
  isOpen,
  onClose,
  memberName,
  memberEmail,
  memberImage,
  onConfirm,
  isRemoving = false,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove Project Member</DialogTitle>
          <DialogDescription>
            This member will lose access to this project
            immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Member Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">
              Removing:
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={memberImage || undefined}
                />
                <AvatarFallback className="text-xs">
                  {memberName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {memberName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {memberEmail}
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            This action cannot be undone. The member can be
            re-added later if needed.
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Remove Member"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

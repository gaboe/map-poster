import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/ui/dialog";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  userEmail?: string;
};

export function DeleteUserDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  userEmail,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            {userEmail
              ? `Are you sure you want to delete ${userEmail}? This action cannot be undone.`
              : "Are you sure you want to delete this user? This action cannot be undone."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" />}
          >
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { OrganizationRoles } from "@map-poster/common";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  currentRole: string;
  onRoleChange: (newRole: string) => void;
};

export function EditMemberRoleModal({
  isOpen,
  onClose,
  userName,
  currentRole,
  onRoleChange,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Member Role</DialogTitle>
          <DialogDescription>
            Change the role for {userName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Role</Label>
            <Select
              defaultValue={currentRole}
              onValueChange={(value) => {
                if (value) onRoleChange(value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OrganizationRoles.Owner}>
                  Owner
                </SelectItem>
                <SelectItem value={OrganizationRoles.Admin}>
                  Admin
                </SelectItem>
                <SelectItem
                  value={OrganizationRoles.Member}
                >
                  Member
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

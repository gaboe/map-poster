import { useState, useMemo } from "react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import { InputTags } from "@/shared/ui/input-tags";
import { Trash2, UserCheck, UserX } from "lucide-react";
import { DataTable } from "@/shared/tables/data-table";
import type {
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { useTRPC } from "@/infrastructure/trpc/react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { RouterOutputs } from "@/infrastructure/trpc/router";
import { useUserInfo } from "@/hooks/users/use-user-info";
import { DeleteUserDialog } from "@/admin/components/delete-user-dialog";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/app/admin/users";

type User =
  RouterOutputs["admin"]["getUsers"]["users"][number];

export function UserManagement() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate({
    from: "/app/admin/users",
  });
  const { include: urlInclude, exclude: urlExclude } =
    Route.useSearch();
  const { data: currentUser } = useUserInfo();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [include, setInclude] = useState<string[]>(
    urlInclude ?? []
  );
  const [exclude, setExclude] = useState<string[]>(
    urlExclude ?? []
  );

  const handlePaginationChange = (newPagination: {
    pageIndex: number;
    pageSize: number;
  }) => {
    setPagination(newPagination);
  };

  const handleSortingChange = (
    newSorting: SortingState
  ) => {
    setSorting(newSorting);
  };

  const handleIncludeChange = (
    newInclude: React.SetStateAction<string[]>
  ) => {
    const updatedInclude =
      typeof newInclude === "function"
        ? newInclude(include)
        : newInclude;
    setInclude(updatedInclude);
    void navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        include:
          updatedInclude.length > 0
            ? updatedInclude
            : undefined,
      }),
    });
  };

  const handleExcludeChange = (
    newExclude: React.SetStateAction<string[]>
  ) => {
    const updatedExclude =
      typeof newExclude === "function"
        ? newExclude(exclude)
        : newExclude;
    setExclude(updatedExclude);
    void navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        exclude:
          updatedExclude.length > 0
            ? updatedExclude
            : undefined,
      }),
    });
  };

  const sortBy = sorting[0]?.id as
    | "name"
    | "email"
    | "role"
    | "createdAt"
    | "lastActiveAt"
    | undefined;
  const sortDirection = sorting[0]?.desc ? "desc" : "asc";

  const { data: usersData } = useQuery(
    trpc.admin.getUsers.queryOptions({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      include: include.length > 0 ? include : undefined,
      exclude: exclude.length > 0 ? exclude : undefined,
      sortBy,
      sortDirection,
    })
  );

  const { data: statsData } = useQuery(
    trpc.admin.getUserStats.queryOptions()
  );

  const users: User[] = usersData?.users || [];
  const totalUsers = usersData?.total || 0;

  const stats = useMemo(() => {
    if (!statsData) {
      return {
        totalUsers: 0,
        adminUsers: 0,
        activeUsersLast24h: 0,
      };
    }
    return {
      totalUsers: statsData.totalUsers,
      adminUsers: statsData.adminUsersCount,
      activeUsersLast24h: statsData.activeUsersLast24h,
    };
  }, [statsData]);

  // Mutation to set user as admin
  const setAdminMutation = useMutation(
    trpc.admin.setUserAdmin.mutationOptions({
      onSuccess: async (data: { message: string }) => {
        toast.success(data.message);
        await queryClient.invalidateQueries({
          queryKey: trpc.admin.getUsers.queryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.admin.getUserStats.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  // Mutation to ban/unban user
  const banMutation = useMutation(
    trpc.admin.banUser.mutationOptions({
      onSuccess: async (data: { message: string }) => {
        toast.success(data.message);
        await queryClient.invalidateQueries({
          queryKey: trpc.admin.getUsers.queryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.admin.getUserStats.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  // Mutation to delete user
  const deleteUserMutation = useMutation(
    trpc.admin.deleteUser.mutationOptions({
      onSuccess: async () => {
        toast.success("User deleted successfully");
        await queryClient.invalidateQueries({
          queryKey: trpc.admin.getUsers.queryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.admin.getUserStats.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const [deleteUserState, setDeleteUserState] = useState<{
    isOpen: boolean;
    userId: string;
    email: string;
  }>({ isOpen: false, userId: "", email: "" });

  const handleSetAdmin = (
    email: string,
    isAdmin: boolean
  ) => {
    // Prevent self-demotion
    if (!isAdmin && currentUser?.email === email) {
      toast.error(
        "You cannot remove yourself from being admin."
      );
      return;
    }
    setAdminMutation.mutate({ email, isAdmin });
  };

  const handleBanUser = (
    userId: string,
    banned: boolean
  ) => {
    banMutation.mutate({
      userId,
      banned,
      reason: banned ? "Administrative action" : undefined,
    });
  };

  // Columns for user table
  const userColumns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.original.email}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      enableSorting: true,
      cell: ({ row }) => {
        const isSelf =
          currentUser?.email === row.original.email;
        return (
          <div className="flex gap-2">
            {row.original.role === "admin" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleSetAdmin(row.original.email, false);
                }}
                disabled={
                  setAdminMutation.isPending || isSelf
                }
                title={
                  isSelf
                    ? "You cannot remove yourself from being admin."
                    : undefined
                }
              >
                Remove Admin
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  handleSetAdmin(row.original.email, true);
                }}
                disabled={setAdminMutation.isPending}
              >
                Make Admin
              </Button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Badge
            variant={
              row.original.role === "admin"
                ? "default"
                : "secondary"
            }
          >
            {row.original.role || "member"}
          </Badge>
          {row.original.banned && (
            <Badge variant="destructive">Banned</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.createdAt
            ? new Date(
                row.original.createdAt
              ).toLocaleDateString()
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "lastActiveAt",
      header: "Last Active",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.lastActiveAt
            ? formatDistanceToNow(
                new Date(row.original.lastActiveAt),
                { addSuffix: true }
              )
            : "-"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.banned ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleBanUser(row.original.id, false);
              }}
              disabled={banMutation.isPending}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Unban
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleBanUser(row.original.id, true);
              }}
              disabled={banMutation.isPending}
            >
              <UserX className="w-4 h-4 mr-2" />
              Ban
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setDeleteUserState({
                isOpen: true,
                userId: row.original.id,
                email: row.original.email,
              });
            }}
            disabled={
              deleteUserMutation.isPending ||
              currentUser?.id === row.original.id
            }
            title={
              currentUser?.id === row.original.id
                ? "You cannot delete your own account"
                : undefined
            }
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          User Management
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Card className="p-3">
          <div className="text-xs font-medium text-muted-foreground">
            Total Users
          </div>
          <div className="text-lg font-bold">
            {stats.totalUsers}
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-xs font-medium text-muted-foreground">
            Admin Users
          </div>
          <div className="text-lg font-bold">
            {stats.adminUsers}
          </div>
        </Card>

        <Card className="p-3">
          <div className="text-xs font-medium text-muted-foreground">
            Active Users (24h)
          </div>
          <div className="text-lg font-bold">
            {stats.activeUsersLast24h}
          </div>
        </Card>
      </div>

      {/* Include/Exclude Filters */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Include only
          </label>
          <InputTags
            value={include}
            onChange={handleIncludeChange}
            placeholder="e.g., blogic, gmail..."
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">
            Exclude
          </label>
          <InputTags
            value={exclude}
            onChange={handleExcludeChange}
            placeholder="e.g., test, demo..."
          />
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={userColumns}
            data={users}
            enablePagination={true}
            enableColumnCustomization={false}
            enableSorting={true}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            pageCount={
              Math.ceil(totalUsers / pagination.pageSize) ||
              1
            }
          />
        </CardContent>
      </Card>

      <DeleteUserDialog
        isOpen={deleteUserState.isOpen}
        onClose={() => {
          setDeleteUserState({
            isOpen: false,
            userId: "",
            email: "",
          });
        }}
        userEmail={deleteUserState.email}
        isDeleting={deleteUserMutation.isPending}
        onConfirm={() => {
          deleteUserMutation.mutate({
            userId: deleteUserState.userId,
          });
        }}
      />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/shared/layout/app-layout";
import { UserManagement } from "@/admin/components/user-management";
import { Schema } from "effect";

const SearchSchema = Schema.Struct({
  include: Schema.optional(
    Schema.mutable(Schema.Array(Schema.String))
  ),
  exclude: Schema.optional(
    Schema.mutable(Schema.Array(Schema.String))
  ),
});

export const Route = createFileRoute("/app/admin/users")({
  validateSearch: Schema.standardSchemaV1(SearchSchema),
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.admin.getUsers.queryOptions({})
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppLayout title="User Management">
      <UserManagement />
    </AppLayout>
  );
}

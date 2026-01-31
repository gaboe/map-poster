import {
  createFileRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";

export const Route = createFileRoute("/app/admin")({
  beforeLoad: async ({ context }) => {
    // Check if user has admin role from Better Auth
    const user = context.session?.user;
    const hasAdminAccess = user?.role === "admin";

    if (!hasAdminAccess) {
      throw redirect({ to: "/app/dashboard" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}

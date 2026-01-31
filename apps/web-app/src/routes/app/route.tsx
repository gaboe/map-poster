import {
  createFileRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  loader: async ({ context }) => {
    // Both queries are critical for layout (sidebar + user info)
    await Promise.all([
      context.queryClient.prefetchQuery(
        context.trpc.organization.getOrganizationsDetails.queryOptions()
      ),
      context.queryClient.prefetchQuery(
        context.trpc.user.getInfo.queryOptions()
      ),
    ]);
  },
  // @ts-expect-error tsgo inference bug: https://github.com/TanStack/router/issues/5724
  beforeLoad: async ({ context }) => {
    if (!context.session?.user) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}

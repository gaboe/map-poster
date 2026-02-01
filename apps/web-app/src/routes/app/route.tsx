import {
  createFileRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.user.getInfo.queryOptions()
    );
  },
  // @ts-expect-error TanStack Router type inference issue with nested route context
  beforeLoad: ({ context }) => {
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

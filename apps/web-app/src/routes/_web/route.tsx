import {
  Outlet,
  createFileRoute,
} from "@tanstack/react-router";
import { getBannerVisibilityServerFn } from "@/infrastructure/banner";
import { WebLayout } from "@/web/layout/web-layout";
import { NotFoundError } from "@/infrastructure/components/errors/not-found-error";

export const Route = createFileRoute("/_web")({
  component: WebLayoutComponent,
  notFoundComponent: () => {
    return (
      <WebLayout>
        <NotFoundError withLayout={true} />
      </WebLayout>
    );
  },
  loader: async () => {
    const bannerData = await getBannerVisibilityServerFn();
    return { bannerData };
  },
});

function WebLayoutComponent() {
  return <Outlet />;
}

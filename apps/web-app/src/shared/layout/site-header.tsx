import { Separator } from "@/shared/ui/separator";
import { SidebarTrigger } from "@/shared/ui/sidebar";

export function SiteHeader(props: {
  title: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const { title, actions } = props;
  return (
    <header className="flex flex-col gap-2 border-b px-4 lg:px-6 pt-6 pb-4">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-lg xl:text-xl font-semibold leading-tight truncate">
            {title}
          </h1>
        </div>
        {actions && (
          <div className="flex-shrink-0 ml-2 hidden sm:block">
            {actions}
          </div>
        )}
      </div>
      {actions && (
        <div className="block sm:hidden ml-8 flex justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}

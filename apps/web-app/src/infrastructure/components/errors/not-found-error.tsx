import { GeneralError } from "./general-error";

type Props = {
  withLayout?: boolean;
};

export function NotFoundError({
  withLayout = false,
}: Props = {}) {
  return (
    <GeneralError title="404" withLayout={withLayout} />
  );
}

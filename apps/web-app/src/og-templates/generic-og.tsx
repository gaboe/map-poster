import { BaseOGLayout } from "./base-og-layout";

type Props = {
  title: string;
  description?: string;
};

export function GenericOG({ title, description }: Props) {
  return (
    <BaseOGLayout
      title={title}
      {...(description !== undefined && {
        subtitle: description,
      })}
    />
  );
}

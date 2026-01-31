import { BaseOGLayout } from "./base-og-layout";

type Props = {
  title: string;
  excerpt: string;
};

export function NewsroomArticleOG({
  title,
  excerpt,
}: Props) {
  return (
    <BaseOGLayout
      title={`News: ${title}`}
      subtitle={excerpt}
    />
  );
}

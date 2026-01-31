import { createWebPageSchema } from "@/utils/structured-data";

type Props = {
  url: string;
  description: string;
  about?: string;
  titleParts: string[];
};

export function StructuredData({
  url,
  description,
  about,
  titleParts,
}: Props) {
  const webpageSchema = createWebPageSchema(
    url,
    description,
    about,
    ...titleParts
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(webpageSchema, null, 0),
      }}
    />
  );
}

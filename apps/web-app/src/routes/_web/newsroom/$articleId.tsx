import {
  createFileRoute,
  notFound,
} from "@tanstack/react-router";
import { WebLayout } from "@/web/layout/web-layout";
import { NewsArticleDetail } from "@/shared/news-article-detail";
import { NEWS_ARTICLES } from "@/shared/newsroom-features";
import {
  seo,
  getCanonicalLinks,
  createPageTitle,
} from "@/utils/seo";
import { StructuredData } from "@/shared/components/structured-data";
import { env } from "@/env/client";

export const Route = createFileRoute(
  "/_web/newsroom/$articleId"
)({
  component: NewsArticleDetailPage,
  loader: ({ params }) => {
    const article = NEWS_ARTICLES.find(
      (a) => a.id === params.articleId
    );
    if (!article) {
      throw notFound();
    }
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return {
      meta: [
        ...seo({
          title: createPageTitle(loaderData.article.title),
          description: loaderData.article.excerpt,
          keywords: loaderData.article.tags.join(", "),
          canonical: `https://map-poster.cz/newsroom/${loaderData.article.id}`,
          image: `${env.VITE_BASE_URL}/api/og/newsroom/${loaderData.article.id}.png`,
        }),
      ],
      links: [
        ...getCanonicalLinks(
          `${env.VITE_BASE_URL}/newsroom/${loaderData.article.id}`
        ),
      ],
    };
  },
});

function NewsArticleDetailPage() {
  const { article } = Route.useLoaderData();

  return (
    <WebLayout>
      <StructuredData
        url={`https://map-poster.cz/newsroom/${article.id}`}
        description={article.excerpt}
        about="News Article"
        titleParts={[article.title]}
      />
      <NewsArticleDetail article={article} />
    </WebLayout>
  );
}

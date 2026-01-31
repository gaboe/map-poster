import { createFileRoute } from "@tanstack/react-router";
import { NEWS_ARTICLES } from "@/shared/newsroom-features";
import { FallbackOG } from "@/og-templates/fallback-og";
import { createOgImageHandler } from "@/utils/create-og-route";
import { NewsroomArticleOG } from "@/og-templates/newsroom-article-og";
import { OG_CACHE } from "@/utils/og-image-generator";

export const Route = createFileRoute(
  "/api/og/newsroom/$articleId"
)({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const articleId = params.articleId
          ?.toLowerCase()
          .replace(/\.png$/, "");

        const article = NEWS_ARTICLES.find(
          (a) => a.id === articleId
        );

        if (!article) {
          return createOgImageHandler(
            () => <FallbackOG />,
            "OG Newsroom Article Image (Fallback)",
            OG_CACHE.short
          )();
        }

        return createOgImageHandler(
          () => (
            <NewsroomArticleOG
              title={article.shortTitle ?? article.title}
              excerpt={
                article.shortDescription ?? article.excerpt
              }
            />
          ),
          "OG Newsroom Article Image",
          OG_CACHE.normal
        )();
      },
    },
  },
});

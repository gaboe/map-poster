import { Link } from "@tanstack/react-router";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  CalendarDays,
  ArrowLeft,
  Clock,
  MapPin,
} from "lucide-react";
import type { NewsArticle } from "@/shared/newsroom-features";

import { formatDate } from "@/shared/utils/date-formatter";

type Props = {
  article: NewsArticle;
};

const formatContent = (content: string) => {
  return content
    .split("\n")
    .map((paragraph, index) => {
      if (paragraph.startsWith("## ")) {
        const title = paragraph.replace("## ", "");

        // Special handling for "What's Inside?" section
        if (title === "What's Inside?") {
          return (
            <div key={index} className="mb-16">
              <h2 className="text-3xl font-bold mt-16 mb-8 text-foreground text-center relative">
                What's Inside?
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 text-center">
                  <h5 className="font-semibold text-foreground text-lg">
                    Seamless Workflow Integration
                  </h5>
                </div>
                <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 text-center">
                  <h5 className="font-semibold text-foreground text-lg">
                    Expanding Integrations
                  </h5>
                </div>
                <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 text-center">
                  <h5 className="font-semibold text-foreground text-lg">
                    With just one connection
                  </h5>
                </div>
                <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 text-center">
                  <h5 className="font-semibold text-foreground text-lg">
                    map-poster Marketplace
                  </h5>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 text-center mb-8">
                <h5 className="font-semibold text-foreground text-lg">
                  Bring Your Own MCP Server
                </h5>
              </div>

              <div className="space-y-6">
                <div className="p-4 rounded-lg border border-primary/20">
                  <h6 className="font-semibold text-foreground mb-2">
                    Seamless Workflow Integration
                  </h6>
                  <p className="text-muted-foreground text-sm">
                    Use map-poster with your AI Agent or
                    Chatbot via MCP SDK, or connect it to
                    platforms like OpenAI, Claude, and
                    automation tools including n8n,
                    Activepieces, and more.
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-primary/20">
                  <h6 className="font-semibold text-foreground mb-2">
                    Expanding Integrations
                  </h6>
                  <p className="text-muted-foreground text-sm">
                    Already supporting a wide range of
                    third-party applications and data
                    sources, with continuous expansion.
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-primary/20">
                  <h6 className="font-semibold text-foreground mb-2">
                    With just one connection
                  </h6>
                  <p className="text-muted-foreground text-sm">
                    map-poster simplifies integration
                    architecture by providing a single
                    access point to all supported services
                    and platforms.
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-primary/20">
                  <h6 className="font-semibold text-foreground mb-2">
                    map-poster Marketplace
                  </h6>
                  <p className="text-muted-foreground text-sm">
                    Our first agent, Agent NEO, enables
                    natural language translation into app
                    calls and smart automatic app selection
                    based on user prompts.
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-primary/20">
                  <h6 className="font-semibold text-foreground mb-2">
                    Bring Your Own MCP Server
                  </h6>
                  <p className="text-muted-foreground text-sm">
                    Flexibility to integrate your own MCP
                    server into map-poster for maximum
                    control.
                  </p>
                </div>
              </div>
            </div>
          );
        }

        return (
          <h2
            key={index}
            className="text-3xl font-bold mt-16 mb-8 text-foreground first:mt-8 relative pl-6"
          >
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
            {title}
          </h2>
        );
      }
      if (
        paragraph.startsWith("**") &&
        paragraph.endsWith("**")
      ) {
        return (
          <h3
            key={index}
            className="text-xl font-semibold mt-10 mb-6 text-foreground"
          >
            {paragraph.replace(/\*\*/g, "")}
          </h3>
        );
      }
      if (paragraph.startsWith("- **")) {
        const [boldPart, regularPart] =
          paragraph.split("** - ");
        return (
          <div
            key={index}
            className="mb-6 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border-l-4 border-primary"
          >
            <div>
              <span className="font-semibold text-foreground text-lg">
                {boldPart?.replace("- **", "") || ""}
              </span>
              {regularPart && (
                <span className="text-muted-foreground">
                  {" "}
                  - {regularPart}
                </span>
              )}
            </div>
          </div>
        );
      }
      if (paragraph.match(/^\*\*[^*]+\*\* - /)) {
        const [boldPart, regularPart] =
          paragraph.split("** - ");
        return (
          <div
            key={index}
            className="mb-6 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border-l-4 border-primary"
          >
            <div>
              <span className="font-semibold text-foreground text-lg">
                {boldPart?.replace(/^\*\*/, "") || ""}
              </span>
              {regularPart && (
                <span className="text-muted-foreground">
                  {" "}
                  - {regularPart}
                </span>
              )}
            </div>
          </div>
        );
      }
      if (
        paragraph.startsWith("**") &&
        paragraph.includes("**:")
      ) {
        const parts = paragraph.split("**:");
        const title = parts[0]?.replace(/\*\*/g, "") || "";

        // Default formatting for other sections
        return (
          <div
            key={index}
            className="mb-8 p-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800"
          >
            <h4 className="font-bold text-foreground text-xl mb-3">
              {title}
            </h4>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {parts[1] || ""}
            </p>
          </div>
        );
      }
      if (paragraph.trim() === "") {
        return <div key={index} className="mb-6" />;
      }
      return (
        <p
          key={index}
          className="mb-6 text-muted-foreground leading-relaxed text-lg"
        >
          {paragraph}
        </p>
      );
    })
    .filter(Boolean);
};

export const NewsArticleDetail = ({ article }: Props) => {
  return (
    <article className="py-16 md:py-32">
      <div className="container max-w-4xl mx-auto px-4 md:px-6">
        {/* Back button */}
        <div className="mb-8">
          <Link
            to="/newsroom"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Newsroom
          </Link>
        </div>

        {/* Article header */}
        <header className="mb-16">
          {/* Article type badge */}
          <div className="mb-8">
            <Badge
              variant="outline"
              className="text-sm bg-white shadow-sm px-4 py-2"
            >
              {article.type.charAt(0).toUpperCase() +
                article.type.slice(1).replace("-", " ")}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-8 text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            {article.title}
          </h1>

          {/* Meta information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-primary/20 to-primary/15 border border-primary/30">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                  Date
                </div>
                <div className="text-sm font-medium">
                  {formatDate(article.date)}
                </div>
              </div>
            </div>

            {article.location && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-950/50 dark:to-blue-900/40 border border-blue-300 dark:border-blue-700">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    Location
                  </div>
                  <div className="text-sm font-medium">
                    {article.location}
                  </div>
                </div>
              </div>
            )}

            {article.readTime && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-green-100 to-green-50 dark:from-green-950/50 dark:to-green-900/40 border border-green-300 dark:border-green-700">
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    Read Time
                  </div>
                  <div className="text-sm font-medium">
                    {article.readTime}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tags positioned right after meta information */}
          <div className="flex justify-start mb-10">
            <div className="flex flex-wrap gap-3">
              {article.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-sm px-3 py-1"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </header>

        {/* Article excerpt */}
        <div className="mb-16 p-8 rounded-2xl bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10 border border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
          <div className="relative">
            <div className="text-sm font-bold text-primary mb-3 uppercase tracking-wide">
              TLDR: Executive Summary
            </div>
            <div className="text-xl text-foreground leading-relaxed font-medium mb-6">
              <strong className="text-primary">
                map-poster launches today
              </strong>{" "}
              as a next-generation platform that empowers
              businesses to seamlessly connect their AI
              solutions to real-time data sources through
              the Model Context Protocol (MCP). The platform
              addresses the critical challenge of AI systems
              needing secure, user-level access to live data
              while maintaining enterprise-grade
              authentication and authorization.
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span>
                  <strong>Target:</strong> Business
                  Analysts, Product Owners, Developers
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>
                  <strong>Key Feature:</strong> Built-in
                  authentication & MCP integration
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>
                  <strong>Impact:</strong> Faster AI
                  solution deployment
                </span>
              </div>
            </div>
            <div className="text-center">
              <Link to="/app">
                <Button
                  size="lg"
                  className="px-8 py-3 text-lg font-semibold"
                >
                  Get Started Now
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Article content */}
        <div className="prose prose-lg max-w-none">
          <div className="article-content">
            {formatContent(article.content)}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/15 border border-primary/30 relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
          <div className="relative">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Ready to Experience map-poster?
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join businesses already using map-poster to
              seamlessly connect their AI solutions to
              real-time data sources.
            </p>
            <Link to="/app">
              <Button
                size="lg"
                className="px-8 py-3 text-lg font-semibold"
              >
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>

        {/* CEO Signature */}
        <div className="mt-12 pt-8 border-t border-muted-foreground/20">
          <div className="text-right">
            <p className="text-lg font-semibold text-foreground mb-1">
              Zdeněk Huspenina
            </p>
            <p className="text-sm text-muted-foreground">
              map-poster CEO
            </p>
          </div>
        </div>

        {/* Article footer */}
        <footer className="mt-16 pt-8 border-t">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-sm">
                Published on {formatDate(article.date)}
                {article.location &&
                  ` in ${article.location}`}
              </p>
            </div>
            <Link to="/newsroom">
              <Button variant="outline" size="sm">
                Read more articles
              </Button>
            </Link>
          </div>
        </footer>
      </div>
    </article>
  );
};

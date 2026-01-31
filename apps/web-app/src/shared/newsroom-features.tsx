import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { CalendarDays, ArrowRight } from "lucide-react";

import { formatDate } from "@/shared/utils/date-formatter";

export type NewsArticle = {
  id: string;
  title: string;
  shortTitle?: string;
  type: "press-release" | "announcement" | "update";
  date: string;
  location?: string;
  excerpt: string;
  shortDescription?: string;
  content: string;
  tags: string[];
  readTime?: string;
  ogImage?: string;
};

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: "introducing-map-poster-production-ready-fullstack-typescript",
    title:
      "Introducing map-poster: A Production-Ready Full-Stack TypeScript Template for Modern Web Development",
    shortTitle: "Introducing map-poster",
    type: "press-release",
    date: "11/13/2025",
    location: "Prague, Czech Republic",
    excerpt:
      "Today we are excited to announce the launch of map-poster, a production-ready full-stack TypeScript template that combines React 19, TanStack Start, TRPC, and PostgreSQL with comprehensive CI/CD configurations.",
    shortDescription:
      "A production-ready full-stack template for building modern web applications with TypeScript.",
    ogImage: "/newsroom/introducing-map-poster.png",
    content: `Today we are excited to announce the launch of map-poster, a production-ready full-stack TypeScript template that combines React 19, TanStack Start, TRPC, and PostgreSQL with comprehensive CI/CD configurations. map-poster is designed to help development teams ship faster by eliminating repetitive setup work and providing a battle-tested architecture out of the box.

## Addressing a Common Challenge

Every new project starts with the same tedious setup: configuring build tools, setting up authentication, connecting databases, implementing CI/CD pipelines, and configuring deployment infrastructure. This setup phase can take weeks or even months before teams can focus on building actual features.

map-poster was created to eliminate this overhead, delivering a complete, production-ready foundation that teams can start building on immediately.

## Who Is It For?

**Startups and MVPs** - Launch faster with a proven architecture instead of spending weeks on infrastructure setup.

**Development Teams** - Focus on building features instead of configuring tooling and solving already-solved problems.

**Solo Developers** - Get enterprise-grade architecture without the complexity of building it from scratch.

With map-poster, every developer can move from idea to production in hours instead of weeks.

## What's Inside?

**Modern React Application** - Built with React 19 and the complete TanStack ecosystem (Router, Query, Form) for type-safe routing and server state management.

**Full-Stack Type Safety** - TanStack Start with embedded TRPC server provides end-to-end type safety from frontend to backend with server-side rendering built-in.

**PostgreSQL Database** - Complete database setup with Drizzle ORM for type-safe queries, schema definitions, and automatic migrations.

**CI/CD Ready** - Production-ready deployment configurations with Docker, Kubernetes manifests, and CI/CD pipeline templates for any cloud provider.

**UI Components** - Pre-configured Shadcn/ui component library with dark mode support, accessible components, and a customizable design system.

**SEO Optimized** - Built-in SEO optimization with meta tags, Open Graph, Twitter Cards, JSON-LD structured data, and automatic sitemap generation.

## Why map-poster?

Unlike starter templates that provide minimal scaffolding, map-poster delivers a complete, production-ready application:

- **Battle-tested architecture** - proven patterns used in real production applications
- **Type safety everywhere** - from database queries to API responses to frontend components
- **Production infrastructure** - Docker, Kubernetes, and deployment pipelines ready to go
- **Developer experience** - hot reload, comprehensive error handling, and AI-friendly codebase structure

## Getting Started

Getting started with map-poster is simple:

1. Clone the repository and run \`./dev.sh\`
2. Configure environment variables and database connection
3. Start developing with hot reload and full type safety
4. Deploy to production using pre-configured Docker and Kubernetes manifests

## Looking Ahead

map-poster is continuously evolving. The roadmap includes additional authentication providers, more deployment targets, enhanced monitoring and observability features, and integration templates for common third-party services.

## About map-poster

map-poster is a full-stack TypeScript template designed to eliminate setup overhead and let developers focus on building features. By combining modern tools like React 19, TanStack Start, TRPC, and PostgreSQL with production-ready infrastructure, map-poster ensures that new projects can go from zero to production in hours instead of weeks.`,
    tags: [
      "Launch",
      "TypeScript",
      "Full-Stack",
      "React",
      "Template",
    ],
    readTime: "4 min read",
  },
];

type Props = {
  article: NewsArticle;
};

const ArticleCard = ({ article }: Props) => {
  return (
    <Link
      to="/newsroom/$articleId"
      params={{ articleId: article.id }}
      className="block"
    >
      <Card className="bg-background transition-colors hover:bg-muted/20 group cursor-pointer">
        <CardContent className="p-0">
          <div className="p-6">
            {/* Article type and date */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <CalendarDays className="h-4 w-4" />
                <span>
                  {formatDate(article.date)}
                  {article.location &&
                    ` • ${article.location}`}
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                {article.type.charAt(0).toUpperCase() +
                  article.type.slice(1).replace("-", " ")}
              </Badge>
            </div>

            {/* Title */}
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                {article.title}
              </CardTitle>
            </CardHeader>

            {/* Excerpt */}
            <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
              {article.excerpt}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags
                .slice(0, 3)
                .map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
            </div>

            {/* Read more and read time */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:text-primary/80 transition-colors">
                Read more
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
              {article.readTime && (
                <span className="text-xs text-muted-foreground">
                  {article.readTime}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const NewsroomFeatures = () => {
  return (
    <section className="py-32">
      <div className="container max-w-5xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="mb-4 text-4xl font-bold tracking-tighter text-foreground sm:text-6xl">
            Newsroom
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay up-to-date with the latest news,
            announcements, and developments from map-poster
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1 max-w-3xl mx-auto">
          {NEWS_ARTICLES.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
            />
          ))}
        </div>

        {/* Coming soon section */}
        <div className="mt-16 text-center">
          <Card className="max-w-md mx-auto py-0 ring-muted-foreground/30">
            <CardContent className="p-8">
              <h3 className="text-lg font-semibold mb-2 text-muted-foreground">
                More articles coming soon
              </h3>
              <p className="text-muted-foreground/70 text-sm">
                Follow us on social media to stay informed
                about the latest updates
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export { NewsroomFeatures };

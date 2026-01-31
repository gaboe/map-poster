import {
  Layers,
  Zap,
  Database,
  Workflow,
  Palette,
  Rocket,
  Brain,
  GitBranch,
  Activity,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/infrastructure/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import { Card, CardContent } from "@/shared/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/ui/tabs";

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  detailDescription?: React.ReactNode;
  icon: React.ReactNode;
  image?: React.ReactNode;
}

const FEATURES: FeatureItem[] = [
  {
    id: "react-app",
    title: "Modern React Application",
    description:
      "React 19 with TanStack ecosystem - Type-safe routing and data fetching",
    detailDescription: (
      <div className="space-y-4">
        <p className="text-lg text-muted-foreground">
          Built with React 19 and the complete TanStack
          ecosystem for modern web development.
        </p>
        <p className="text-sm text-muted-foreground">
          Get started with a proven architecture that
          includes TanStack Router for type-safe routing,
          TanStack Query for server state management, and
          TanStack Form for powerful form handling.
          Everything is pre-configured and ready to use.
        </p>
      </div>
    ),
    icon: <Layers className="h-5 w-5" />,
  },
  {
    id: "tanstack-fullstack",
    title: "TanStack Full-Stack Framework",
    description:
      "TanStack Start with embedded TRPC server - SSR and type-safe APIs out of the box",
    detailDescription: (
      <div className="space-y-4">
        <p className="text-lg text-muted-foreground">
          Full-stack type safety from frontend to backend
          with TanStack Start and TRPC.
        </p>
        <p className="text-sm text-muted-foreground">
          Server-side rendering, API routes, and type-safe
          client-server communication are all built-in. No
          need to manually sync types or write API contracts
          - it just works.
        </p>
      </div>
    ),
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: "postgresql",
    title: "PostgreSQL Database",
    description:
      "Drizzle ORM for type-safe database access - Migration system included",
    detailDescription: (
      <div className="space-y-4">
        <p className="text-lg text-muted-foreground">
          Type-safe database queries with Drizzle ORM and
          PostgreSQL.
        </p>
        <p className="text-sm text-muted-foreground">
          Complete database setup with Drizzle ORM for
          type-safe queries, schema definitions, and
          automatic migrations. Works seamlessly with
          PostgreSQL for production-ready data storage.
        </p>
      </div>
    ),
    icon: <Database className="h-5 w-5" />,
  },
  {
    id: "cicd-ready",
    title: "CI/CD Ready",
    description:
      "Docker, Kubernetes, and deployment pipelines pre-configured",
    detailDescription: (
      <div className="space-y-4">
        <p className="text-lg text-muted-foreground">
          Production-ready deployment configurations
          included out of the box.
        </p>
        <p className="text-sm text-muted-foreground">
          Docker configurations for containerization,
          Kubernetes manifests for orchestration, and CI/CD
          pipeline templates. Deploy to any cloud provider
          with minimal setup.
        </p>
      </div>
    ),
    icon: <Workflow className="h-5 w-5" />,
  },
  {
    id: "ui-components",
    title: "UI Components Ready",
    description:
      "Shadcn/ui components and dark mode pre-configured",
    detailDescription: (
      <div className="space-y-4">
        <p className="text-lg text-muted-foreground">
          Beautiful UI components with Shadcn/ui and full
          dark mode support.
        </p>
        <p className="text-sm text-muted-foreground">
          Complete component library with Shadcn/ui
          pre-installed and configured. Dark mode theming,
          accessible components, and customizable design
          system ready to use.
        </p>
      </div>
    ),
    icon: <Palette className="h-5 w-5" />,
  },
  {
    id: "seo-optimized",
    title: "SEO Optimized",
    description:
      "Meta tags, Open Graph, structured data, and sitemap all pre-configured",
    detailDescription: (
      <div className="space-y-4">
        <p className="text-lg text-muted-foreground">
          Built-in SEO optimization for better search engine
          visibility.
        </p>
        <p className="text-sm text-muted-foreground">
          Includes meta tags, Open Graph tags, Twitter
          Cards, JSON-LD structured data, automatic sitemap
          generation, and canonical URLs. Everything
          configured for optimal SEO.
        </p>
      </div>
    ),
    icon: <Rocket className="h-5 w-5" />,
  },
  {
    id: "ai-agent-ready",
    title: "AI Agent Ready",
    description:
      "Comprehensive CLAUDE.md guidelines and project-specific skills for AI agent development",
    detailDescription: (
      <div className="space-y-4">
        <p className="text-lg text-muted-foreground">
          Optimized for AI agent development with
          comprehensive documentation and structured
          patterns.
        </p>
        <p className="text-sm text-muted-foreground">
          Includes extensive CLAUDE.md development
          guidelines, project-specific Claude skills for
          TRPC patterns and TanStack frontend, type-safe
          patterns with TypeScript, and agent-friendly
          codebase structure with consistent naming
          conventions and absolute imports.
        </p>
      </div>
    ),
    icon: <Brain className="h-5 w-5" />,
  },
  {
    id: "observability",
    title: "Observability",
    description:
      "Sentry error tracking and OpenTelemetry with database reporting built-in",
    detailDescription: (
      <div className="space-y-4">
        <p className="text-lg text-muted-foreground">
          Complete observability stack with Sentry and
          OpenTelemetry integration.
        </p>
        <p className="text-sm text-muted-foreground">
          Pre-configured Sentry for error tracking and
          monitoring, OpenTelemetry for distributed tracing,
          and database query reporting. Monitor performance,
          track errors, and debug issues in production with
          comprehensive observability tools.
        </p>
      </div>
    ),
    icon: <Activity className="h-5 w-5" />,
  },
  {
    id: "git-hooks",
    title: "Git Pre-commit Hooks",
    description:
      "Automated linting and code quality checks before every commit",
    detailDescription: (
      <div className="space-y-4">
        <p className="text-lg text-muted-foreground">
          Ensure code quality with automated pre-commit
          hooks and linting.
        </p>
        <p className="text-sm text-muted-foreground">
          Pre-configured Git hooks that automatically run
          linting, formatting, and type checking before
          commits. Catches issues early and maintains
          consistent code quality across the entire
          codebase.
        </p>
      </div>
    ),
    icon: <GitBranch className="h-5 w-5" />,
  },
];

const AiFeaturesInteractive = () => {
  const [activeTab, setActiveTab] = useState<string>(
    FEATURES[0]?.id || "authentication"
  );
  const isMobile = useIsMobile();

  const renderDetailContent = (
    feature: FeatureItem,
    showTitle = true
  ) => (
    <Card className="mt-4 py-0">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="p-8">
            {showTitle && (
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold">
                  {feature.title}
                </h3>
              </div>
            )}
            <div className="text-lg text-muted-foreground leading-relaxed">
              {feature.detailDescription ??
                feature.description}
            </div>
          </div>
          <div className="bg-muted overflow-hidden flex items-center justify-center">
            <div
              className={`w-full flex items-center justify-center ${feature.id === "security-privacy" ? "min-h-[300px] aspect-[4/3]" : "aspect-video"}`}
            >
              {feature.image ? (
                typeof feature.image === "string" ? (
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  feature.image
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <p className="text-muted-foreground">
                    Image placeholder
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section className="w-full">
      <div className="container max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-4 sm:mb-8">
          <h2 className="mb-4 text-3xl font-bold tracking-tighter text-foreground sm:text-5xl">
            Main features
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the powerful features
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {isMobile ? (
            // Mobile layout: inline details below each clicked tile
            <div className="space-y-4">
              {FEATURES.map((feature) => (
                <div key={feature.id}>
                  <Card
                    className={cn(
                      "cursor-pointer overflow-hidden transition-colors hover:bg-muted/20",
                      activeTab === feature.id
                        ? "ring-2 ring-primary"
                        : ""
                    )}
                    onClick={() => {
                      setActiveTab(feature.id);
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col items-start space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            {feature.icon}
                          </div>
                          <h3 className="text-lg font-semibold">
                            {feature.title}
                          </h3>
                        </div>
                        <p className="text-left text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  {activeTab === feature.id &&
                    renderDetailContent(feature, false)}
                </div>
              ))}
            </div>
          ) : (
            // Desktop layout: original tabs layout
            <Tabs
              defaultValue={
                FEATURES[0]?.id || "authentication"
              }
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map((feature) => (
                  <Card
                    key={feature.id}
                    className={cn(
                      "cursor-pointer overflow-hidden transition-colors hover:bg-muted/20 h-full",
                      activeTab === feature.id
                        ? "ring-2 ring-primary"
                        : ""
                    )}
                    onClick={() => {
                      setActiveTab(feature.id);
                    }}
                  >
                    <CardContent className="h-full flex items-center">
                      <div className="flex flex-col items-start space-y-2 w-full">
                        <div className="flex items-center space-x-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            {feature.icon}
                          </div>
                          <h3 className="text-lg font-semibold">
                            {feature.title}
                          </h3>
                        </div>
                        {/* <p className="text-left text-sm text-muted-foreground">
                          {feature.description}
                        </p> */}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Hidden TabsList with TabsTriggers for accessibility */}
              <div className="sr-only">
                <TabsList>
                  {FEATURES.map((feature) => (
                    <TabsTrigger
                      key={feature.id}
                      value={feature.id}
                    >
                      {feature.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="mt-8">
                {FEATURES.map((feature) => (
                  <TabsContent
                    key={feature.id}
                    value={feature.id}
                    className="mt-0"
                  >
                    {renderDetailContent(feature)}
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          )}
        </div>
      </div>
    </section>
  );
};

export { AiFeaturesInteractive };

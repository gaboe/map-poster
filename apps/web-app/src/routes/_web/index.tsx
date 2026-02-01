import { createFileRoute } from "@tanstack/react-router";
import { useTRPC } from "@/infrastructure/trpc/react";
import {
  useSuspenseQuery,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { seo, getCanonicalLinks } from "@/utils/seo";
import { env } from "@/env/client";
import { WebLayout } from "@/web/layout/web-layout";
import { useState, useEffect } from "react";
import { MapPinIcon, SparklesIcon } from "lucide-react";
import { useGeolocation } from "@/map-poster/hooks/use-geolocation";

export const Route = createFileRoute("/_web/")({
  component: Home,
  head: () => ({
    meta: [
      ...seo({
        title: "Map Poster - Create Stunning Map Art",
        description:
          "Create stunning, personalized map posters of any location. Choose from 17 beautiful themes and generate your custom city map in seconds.",
        keywords:
          "map poster, city map, custom map, map art, location poster, cartography",
        canonical: env.VITE_BASE_URL,
        image: `${env.VITE_BASE_URL}/api/og/page/homepage.png`,
      }),
    ],
    links: [...getCanonicalLinks(env.VITE_BASE_URL)],
  }),
});

function Home() {
  const trpc = useTRPC();
  const geolocation = useGeolocation();

  const { data: themes } = useSuspenseQuery(
    trpc.mapPoster.listThemes.queryOptions()
  );

  const [selectedTheme, setSelectedTheme] =
    useState<string>("");
  const [location, setLocation] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    if (themes.length > 0 && !selectedTheme && themes[0]) {
      setSelectedTheme(themes[0].id);
    }
  }, [themes, selectedTheme]);

  useEffect(() => {
    if (
      geolocation.status === "success" &&
      !location &&
      geolocation.city
    ) {
      setLocation(geolocation.city);
    }
  }, [geolocation.status, geolocation.city, location]);

  const generateMutation = useMutation(
    trpc.mapPoster.generatePreview.mutationOptions({
      onSuccess: (data) => {
        setJobId(data.jobId);
      },
      onError: (error) => {
        console.error("Generation error:", error);
      },
    })
  );

  const { data: status } = useQuery({
    ...trpc.mapPoster.getStatus.queryOptions({
      jobId: jobId ?? "",
    }),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      if (
        data.status === "completed" ||
        data.status === "failed"
      ) {
        return false;
      }
      return 2000;
    },
  });

  const handleGenerate = () => {
    if (!location || !selectedTheme) return;

    generateMutation.mutate({
      lat: geolocation.lat,
      lon: geolocation.lon,
      theme: selectedTheme,
    });
  };

  const isGenerating =
    generateMutation.isPending ||
    status?.status === "pending" ||
    status?.status === "processing";

  return (
    <WebLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
        <div className="container mx-auto px-4 pt-16 pb-8">
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight bg-gradient-to-br from-slate-900 via-blue-800 to-slate-700 dark:from-slate-100 dark:via-blue-200 dark:to-slate-300 bg-clip-text text-transparent">
              Create Your
              <br />
              Perfect Map Poster
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Transform any location into stunning wall art.
              Choose from 17 unique themes and watch your
              map come to life.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_400px] gap-8 max-w-7xl mx-auto">
            <div className="order-2 lg:order-1">
              <Card className="overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-2xl">
                <CardContent className="p-0">
                  <div className="aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 relative overflow-hidden">
                    {isGenerating ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 space-y-6">
                        <div className="absolute inset-0 opacity-10">
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage: `
                                linear-gradient(to right, currentColor 1px, transparent 1px),
                                linear-gradient(to bottom, currentColor 1px, transparent 1px)
                              `,
                              backgroundSize: "40px 40px",
                            }}
                          />
                        </div>
                        <div className="relative z-10 text-center space-y-4">
                          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/20 animate-pulse">
                            <MapPinIcon className="size-10 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                              Generating Your Map
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                              {status?.status ===
                              "processing"
                                ? `${status.progress}% complete`
                                : "Preparing your poster..."}
                            </p>
                          </div>
                          <div className="w-64 h-2 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                              style={{
                                width: `${status?.progress ?? 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : status?.url ? (
                      <img
                        src={status.url}
                        alt="Generated map poster"
                        className="w-full h-full object-cover"
                        data-testid="poster-preview"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <div
                          className="absolute inset-0 opacity-5"
                          style={{
                            backgroundImage: `
                              linear-gradient(to right, currentColor 1px, transparent 1px),
                              linear-gradient(to bottom, currentColor 1px, transparent 1px)
                            `,
                            backgroundSize: "60px 60px",
                          }}
                        />
                        <MapPinIcon className="size-16 text-slate-400 dark:text-slate-600" />
                        <div className="space-y-2">
                          <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                            Your Map Preview
                          </h3>
                          <p className="text-slate-500 dark:text-slate-500 max-w-sm">
                            Enter a location and select a
                            theme to generate your custom
                            map poster
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="order-1 lg:order-2">
              <Card className="sticky top-8 border-2 border-slate-200 dark:border-slate-800 shadow-xl">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      Customize Your Map
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Choose your location and style
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Location
                      </label>
                      <div className="relative">
                        <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input
                          placeholder="Enter city or address"
                          value={location}
                          onChange={(e) =>
                            setLocation(e.target.value)
                          }
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        Try: Prague, New York, Tokyo, Paris
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Theme
                      </label>
                      <Select
                        value={selectedTheme}
                        onValueChange={(value) => {
                          if (value)
                            setSelectedTheme(value);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a theme">
                            {themes.find(
                              (t) => t.id === selectedTheme
                            )?.name ?? "Select a theme"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {themes.map((theme) => (
                            <SelectItem
                              key={theme.id}
                              value={theme.id}
                            >
                              {theme.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {themes.length} unique styles
                        available
                      </p>
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={
                        !location ||
                        !selectedTheme ||
                        isGenerating
                      }
                      className="w-full h-12 text-base font-semibold"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <SparklesIcon className="size-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="size-5" />
                          Generate Map
                        </>
                      )}
                    </Button>
                  </div>

                  {status?.status === "failed" && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-700 dark:text-red-400">
                        Generation failed. Please try again.
                      </p>
                    </div>
                  )}

                  {status?.status === "completed" && (
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                        Map generated successfully!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2">
                <SparklesIcon className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                17 Unique Themes
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                From minimalist to vibrant, find the perfect
                style for your space
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2">
                <MapPinIcon className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Any Location
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Create maps of cities, neighborhoods, or
                special places worldwide
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2">
                <svg
                  className="size-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Instant Generation
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                AI-powered rendering delivers your poster in
                seconds
              </p>
            </div>
          </div>
        </div>
      </div>
    </WebLayout>
  );
}

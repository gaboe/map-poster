import { createFileRoute } from "@tanstack/react-router";
import { useTRPC } from "@/infrastructure/trpc/react";
import {
  useSuspenseQuery,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { seo, getCanonicalLinks } from "@/utils/seo";
import { env } from "@/env/client";
import { WebLayout } from "@/web/layout/web-layout";
import { useState, useEffect, useRef } from "react";
import {
  MapPinIcon,
  SparklesIcon,
  CheckIcon,
} from "lucide-react";
import { useGeolocation } from "@/map-poster/hooks/use-geolocation";
import logoSvg from "@/assets/logo.svg";

export const Route = createFileRoute("/_web/")({
  component: Home,
  head: () => ({
    meta: [
      ...seo({
        title:
          "Tady Bydlíme - Personalizovaný mapový poster",
        description:
          "Vytvoř si nádherný mapový poster svého oblíbeného místa. Vyber si z 17 unikátních témat a vygeneruj vlastní mapu během pár sekund.",
        keywords:
          "mapový poster, mapa města, vlastní mapa, mapové umění, plakát lokace, tadybydlime",
        canonical: env.VITE_BASE_URL,
        image: `${env.VITE_BASE_URL}/api/og/page/homepage.png`,
      }),
    ],
    links: [...getCanonicalLinks(env.VITE_BASE_URL)],
  }),
});

type DesignTheme = "warm" | "playful" | "nordic" | "mono";

type ThemeConfig = {
  name: string;
  emoji: string;
  colors: {
    bgGradient: string;
    cardBg: string;
    cardBorder: string;
    headlineText: string;
    bodyText: string;
    mutedText: string;
    primaryButton: string;
    primaryButtonHover: string;
    accentBg: string;
    accentText: string;
    inputBorder: string;
    inputFocus: string;
    selectedBorder: string;
    selectedRing: string;
  };
};

const themes: Record<DesignTheme, ThemeConfig> = {
  warm: {
    name: "Teplý",
    emoji: "🌅",
    colors: {
      bgGradient: "from-amber-50 via-stone-50 to-orange-50",
      cardBg: "bg-white/80 backdrop-blur-sm",
      cardBorder: "border-stone-200",
      headlineText: "text-stone-900",
      bodyText: "text-stone-600",
      mutedText: "text-stone-500",
      primaryButton: "bg-amber-600 hover:bg-amber-700",
      primaryButtonHover: "hover:bg-amber-700",
      accentBg: "bg-amber-100",
      accentText: "text-amber-700",
      inputBorder: "border-stone-300",
      inputFocus: "focus:border-amber-500",
      selectedBorder: "border-amber-600",
      selectedRing: "ring-amber-600/20",
    },
  },
  playful: {
    name: "Hravý",
    emoji: "🎨",
    colors: {
      bgGradient: "from-rose-50 via-pink-50 to-coral-50",
      cardBg: "bg-white/90 backdrop-blur-sm",
      cardBorder: "border-rose-200",
      headlineText: "text-rose-900",
      bodyText: "text-rose-700",
      mutedText: "text-rose-500",
      primaryButton:
        "bg-gradient-to-r from-coral-500 to-rose-500 hover:from-coral-600 hover:to-rose-600",
      primaryButtonHover:
        "hover:from-coral-600 hover:to-rose-600",
      accentBg: "bg-rose-100",
      accentText: "text-rose-700",
      inputBorder: "border-rose-300",
      inputFocus: "focus:border-rose-500",
      selectedBorder: "border-rose-600",
      selectedRing: "ring-rose-600/20",
    },
  },
  nordic: {
    name: "Severský",
    emoji: "🌲",
    colors: {
      bgGradient:
        "from-slate-100 via-gray-100 to-slate-200",
      cardBg: "bg-white/70 backdrop-blur-sm",
      cardBorder: "border-slate-300",
      headlineText: "text-slate-900",
      bodyText: "text-slate-700",
      mutedText: "text-slate-500",
      primaryButton: "bg-slate-800 hover:bg-slate-900",
      primaryButtonHover: "hover:bg-slate-900",
      accentBg: "bg-slate-200",
      accentText: "text-slate-800",
      inputBorder: "border-slate-400",
      inputFocus: "focus:border-slate-600",
      selectedBorder: "border-slate-700",
      selectedRing: "ring-slate-700/20",
    },
  },
  mono: {
    name: "Mono",
    emoji: "⚫",
    colors: {
      bgGradient: "from-white via-gray-50 to-white",
      cardBg: "bg-white border-2",
      cardBorder: "border-black",
      headlineText: "text-black",
      bodyText: "text-gray-800",
      mutedText: "text-gray-600",
      primaryButton: "bg-black hover:bg-gray-800",
      primaryButtonHover: "hover:bg-gray-800",
      accentBg: "bg-gray-100",
      accentText: "text-black",
      inputBorder: "border-black",
      inputFocus:
        "focus:border-black focus:ring-2 focus:ring-black",
      selectedBorder: "border-black border-4",
      selectedRing: "ring-black/30",
    },
  },
};

function ThemeSwitcher({
  currentTheme,
  onThemeChange,
}: {
  currentTheme: DesignTheme;
  onThemeChange: (theme: DesignTheme) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = themes[currentTheme];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isExpanded ? (
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-stone-200 p-4">
          <div className="mb-3 text-center">
            <p className="text-sm font-semibold text-stone-700">
              Vyber téma
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(themes) as DesignTheme[]).map(
              (themeKey) => {
                const t = themes[themeKey];
                const isSelected =
                  themeKey === currentTheme;
                return (
                  <button
                    key={themeKey}
                    onClick={() => {
                      onThemeChange(themeKey);
                      setIsExpanded(false);
                    }}
                    className={`
                    relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl
                    border-2 transition-all duration-200
                    ${isSelected ? "border-stone-900 bg-stone-50 shadow-md" : "border-stone-200 hover:border-stone-400 hover:bg-stone-50"}
                  `}
                  >
                    <span className="text-3xl">
                      {t.emoji}
                    </span>
                    <span className="text-xs font-medium text-stone-700">
                      {t.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckIcon className="size-4 text-stone-900" />
                      </div>
                    )}
                  </button>
                );
              }
            )}
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="mt-3 w-full text-xs text-stone-500 hover:text-stone-700 transition-colors"
          >
            Zavřít
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-4 py-3 bg-white rounded-full shadow-lg border-2 border-stone-200 hover:shadow-xl hover:border-stone-300 transition-all duration-200"
        >
          <span className="text-xl">{theme.emoji}</span>
          <span className="text-sm font-medium text-stone-700">
            {theme.name}
          </span>
        </button>
      )}
    </div>
  );
}

function Home() {
  const trpc = useTRPC();
  const geolocation = useGeolocation();

  const { data: posterThemes } = useSuspenseQuery(
    trpc.mapPoster.listThemes.queryOptions()
  );

  const [designTheme, setDesignTheme] =
    useState<DesignTheme>("warm");
  const [selectedPosterTheme, setSelectedPosterTheme] =
    useState<string>("");
  const [location, setLocation] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const hasAutoGenerated = useRef(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(
      "map-poster-design-theme"
    );
    if (savedTheme && savedTheme in themes) {
      setDesignTheme(savedTheme as DesignTheme);
    }
  }, []);

  const handleThemeChange = (theme: DesignTheme) => {
    setDesignTheme(theme);
    localStorage.setItem("map-poster-design-theme", theme);
  };

  useEffect(() => {
    if (
      posterThemes.length > 0 &&
      !selectedPosterTheme &&
      posterThemes[0]
    ) {
      setSelectedPosterTheme(posterThemes[0].id);
    }
  }, [posterThemes, selectedPosterTheme]);

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

  useEffect(() => {
    if (
      !hasAutoGenerated.current &&
      geolocation.status === "success" &&
      geolocation.lat !== undefined &&
      geolocation.lon !== undefined &&
      selectedPosterTheme &&
      !generateMutation.isPending
    ) {
      hasAutoGenerated.current = true;
      generateMutation.mutate({
        lat: geolocation.lat,
        lon: geolocation.lon,
        theme: selectedPosterTheme,
      });
    }
  }, [
    geolocation.status,
    geolocation.lat,
    geolocation.lon,
    selectedPosterTheme,
    generateMutation,
  ]);

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
    if (!location || !selectedPosterTheme) return;

    generateMutation.mutate({
      lat: geolocation.lat,
      lon: geolocation.lon,
      theme: selectedPosterTheme,
    });
  };

  const isGenerating =
    generateMutation.isPending ||
    status?.status === "pending" ||
    status?.status === "processing";

  const currentTheme = themes[designTheme];

  return (
    <WebLayout>
      <div
        className={`min-h-screen bg-gradient-to-br ${currentTheme.colors.bgGradient} transition-colors duration-500`}
      >
        <div className="container mx-auto px-4 pt-8 pb-4">
          <div className="text-center mb-6 space-y-2">
            <img
              src={logoSvg}
              alt="Tady Bydlíme"
              className="size-20 mx-auto"
            />
            <p
              className={`text-sm ${currentTheme.colors.bodyText} max-w-md mx-auto transition-colors duration-500`}
            >
              Personalizovaný mapový poster za pár sekund
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto items-stretch">
            <div className="order-2 lg:order-1 flex h-full">
              <div
                className={`overflow-hidden border-2 rounded-xl ${currentTheme.colors.cardBorder} shadow-2xl transition-all duration-500 flex-1 h-full min-h-[320px] bg-gradient-to-br from-stone-100 to-stone-200 relative flex items-center justify-center`}
              >
                {isGenerating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-4">
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
                    <div className="relative z-10 text-center space-y-3">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${currentTheme.colors.accentBg} animate-pulse transition-colors duration-500`}
                      >
                        <MapPinIcon
                          className={`size-8 ${currentTheme.colors.accentText} transition-colors duration-500`}
                        />
                      </div>
                      <div className="space-y-2">
                        <h3
                          className={`text-xl font-bold ${currentTheme.colors.headlineText} transition-colors duration-500`}
                        >
                          Generuji Tvou Mapu
                        </h3>
                        <p
                          className={`${currentTheme.colors.bodyText} transition-colors duration-500`}
                        >
                          {status?.status === "processing"
                            ? `${status.progress}% hotovo`
                            : "Připravuji tvůj plakát..."}
                        </p>
                      </div>
                      <div className="w-56 h-2 bg-stone-300 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${currentTheme.colors.primaryButton} transition-all duration-500 ease-out`}
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
                    alt="Vygenerovaný mapový plakát"
                    className="w-full h-full object-contain"
                    data-testid="poster-preview"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3">
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
                    <MapPinIcon className="size-14 text-stone-400" />
                    <div className="space-y-1">
                      <h3
                        className={`text-xl font-bold ${currentTheme.colors.headlineText} transition-colors duration-500`}
                      >
                        Náhled Tvé Mapy
                      </h3>
                      <p
                        className={`${currentTheme.colors.mutedText} max-w-xs text-sm transition-colors duration-500`}
                      >
                        Zadej místo a vyber téma pro
                        vygenerování tvého vlastního
                        mapového plakátu
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="order-1 lg:order-2 flex h-full">
              <Card
                className={`lg:sticky lg:top-8 border-2 ${currentTheme.colors.cardBorder} ${currentTheme.colors.cardBg} shadow-xl transition-all duration-500 flex-1 h-full`}
              >
                <CardContent className="p-4 h-full flex flex-col gap-3">
                  <div>
                    <h2
                      className={`text-lg font-bold ${currentTheme.colors.headlineText} transition-colors duration-500`}
                    >
                      Přizpůsob Si Mapu
                    </h2>
                    <p
                      className={`text-xs ${currentTheme.colors.bodyText} transition-colors duration-500`}
                    >
                      Vyber si místo a styl
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label
                        className={`text-xs font-medium ${currentTheme.colors.bodyText} transition-colors duration-500`}
                      >
                        Místo
                      </label>
                      <div className="relative">
                        <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
                        <Input
                          placeholder="Zadej město nebo adresu"
                          value={location}
                          onChange={(e) =>
                            setLocation(e.target.value)
                          }
                          className={`pl-10 h-9 text-sm ${currentTheme.colors.inputBorder} ${currentTheme.colors.inputFocus} transition-colors duration-500`}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label
                        className={`text-xs font-medium ${currentTheme.colors.bodyText} transition-colors duration-500`}
                      >
                        Téma ({posterThemes.length})
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {posterThemes.map((theme) => {
                          const isSelected =
                            theme.id ===
                            selectedPosterTheme;
                          return (
                            <button
                              key={theme.id}
                              onClick={() =>
                                setSelectedPosterTheme(
                                  theme.id
                                )
                              }
                              className={`
                                relative px-2 py-1.5 rounded-md border text-center transition-all duration-200
                                ${
                                  isSelected
                                    ? `${currentTheme.colors.selectedBorder} ${currentTheme.colors.accentBg} font-semibold`
                                    : `${currentTheme.colors.cardBorder} hover:bg-stone-50`
                                }
                              `}
                            >
                              <span
                                className={`text-[11px] ${isSelected ? currentTheme.colors.accentText : currentTheme.colors.bodyText} transition-colors duration-500`}
                              >
                                {theme.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={
                        !location ||
                        !selectedPosterTheme ||
                        isGenerating
                      }
                      className={`w-full h-9 text-sm font-semibold ${currentTheme.colors.primaryButton} text-white transition-all duration-500`}
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <SparklesIcon className="size-5 animate-spin" />
                          Generuji...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="size-5" />
                          Vygenerovat Mapu
                        </>
                      )}
                    </Button>
                  </div>

                  {status?.status === "failed" && (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-700">
                        Generování selhalo. Zkus to prosím
                        znovu.
                      </p>
                    </div>
                  )}

                  {status?.status === "completed" && (
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-sm text-green-700 font-medium">
                        Mapa úspěšně vygenerována!
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
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${currentTheme.colors.accentBg} ${currentTheme.colors.accentText} mb-2 transition-colors duration-500`}
              >
                <SparklesIcon className="size-6" />
              </div>
              <h3
                className={`text-lg font-bold ${currentTheme.colors.headlineText} transition-colors duration-500`}
              >
                17 Unikátních Témat
              </h3>
              <p
                className={`text-sm ${currentTheme.colors.bodyText} transition-colors duration-500`}
              >
                Od minimalistických po živé, najdi perfektní
                styl pro tvůj prostor
              </p>
            </div>
            <div className="text-center space-y-3">
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${currentTheme.colors.accentBg} ${currentTheme.colors.accentText} mb-2 transition-colors duration-500`}
              >
                <MapPinIcon className="size-6" />
              </div>
              <h3
                className={`text-lg font-bold ${currentTheme.colors.headlineText} transition-colors duration-500`}
              >
                Jakékoliv Místo
              </h3>
              <p
                className={`text-sm ${currentTheme.colors.bodyText} transition-colors duration-500`}
              >
                Vytvoř mapy měst, čtvrtí nebo speciálních
                míst po celém světě
              </p>
            </div>
            <div className="text-center space-y-3">
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${currentTheme.colors.accentBg} ${currentTheme.colors.accentText} mb-2 transition-colors duration-500`}
              >
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
              <h3
                className={`text-lg font-bold ${currentTheme.colors.headlineText} transition-colors duration-500`}
              >
                Okamžité Generování
              </h3>
              <p
                className={`text-sm ${currentTheme.colors.bodyText} transition-colors duration-500`}
              >
                AI-powered vykreslování dodá tvůj plakát
                během vteřin
              </p>
            </div>
          </div>
        </div>

        <ThemeSwitcher
          currentTheme={designTheme}
          onThemeChange={handleThemeChange}
        />
      </div>
    </WebLayout>
  );
}

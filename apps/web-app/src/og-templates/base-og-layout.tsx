import { LOGO_BASE64 } from "@/generated/logo-base64";

type Props = {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  children?: React.ReactNode;
};

export function BaseOGLayout({
  title,
  subtitle,
  showLogo = true,
  children,
}: Props) {
  const logoSrc = LOGO_BASE64;

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#ffffff",
        position: "relative",
        padding: "80px 100px",
      }}
    >
      {/* Gradient blobs in background - similar to GradientBackground default variant */}
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          top: "-100px",
          left: "-100px",
          borderRadius: "9999px",
          opacity: 0.3,
          filter: "blur(150px)",
          background: "rgba(168, 85, 247, 0.6)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "700px",
          height: "700px",
          bottom: "-200px",
          left: "15%",
          borderRadius: "9999px",
          opacity: 0.25,
          filter: "blur(150px)",
          background: "rgba(251, 191, 36, 0.5)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "800px",
          height: "800px",
          top: "200px",
          right: "-200px",
          borderRadius: "9999px",
          opacity: 0.3,
          filter: "blur(150px)",
          background: "rgba(236, 72, 153, 0.6)",
        }}
      />
      {/* Logo Section - Top */}
      {showLogo && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <img
            src={logoSrc}
            width={120}
            height={120}
            alt="map-poster Logo"
          />
        </div>
      )}

      {/* Custom children content */}
      {children}

      {/* Title & Subtitle - Center */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: "72px",
            fontWeight: 700,
            color: "#0f172a",
            fontFamily: "Oxanium",
            textAlign: "center",
            lineHeight: 1.2,
            maxWidth: "1000px",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: "28px",
              color: "#475569",
              textAlign: "center",
              fontFamily: "Oxanium",
              fontWeight: 400,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {/* Features - Bottom */}
      <div
        style={{
          display: "flex",
          gap: "60px",
        }}
      >
        <div
          style={{
            fontSize: "24px",
            color: "#64748b",
            fontFamily: "Oxanium",
            fontWeight: 500,
          }}
        >
          OAuth 2.1
        </div>
        <div
          style={{
            fontSize: "24px",
            color: "#64748b",
            fontFamily: "Oxanium",
            fontWeight: 500,
          }}
        >
          MCP Servers
        </div>
        <div
          style={{
            fontSize: "24px",
            color: "#64748b",
            fontFamily: "Oxanium",
            fontWeight: 500,
          }}
        >
          500+ Tools
        </div>
      </div>
    </div>
  );
}

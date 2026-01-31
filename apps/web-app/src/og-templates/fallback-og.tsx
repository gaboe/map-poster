export function FallbackOG() {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "80px",
      }}
    >
      {/* Logo/Brand Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "60px",
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="12" r="10" fill="#3b82f6" />
        </svg>
        <div
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: "white",
            marginLeft: "16px",
            fontFamily: "Oxanium",
          }}
        >
          map-poster
        </div>
      </div>

      {/* Coming Soon Message */}
      <div
        style={{
          fontSize: "72px",
          fontWeight: 700,
          color: "white",
          marginBottom: "24px",
          fontFamily: "Oxanium",
          textAlign: "center",
        }}
      >
        Coming Soon
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: "28px",
          color: "#94a3b8",
          maxWidth: "800px",
          textAlign: "center",
          lineHeight: 1.4,
          fontFamily: "Oxanium",
          fontWeight: 400,
        }}
      >
        This integration will be available soon
      </div>

      {/* Decorative Element */}
      <div
        style={{
          marginTop: "48px",
          display: "flex",
          gap: "12px",
        }}
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              opacity: 0.3 + i * 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}

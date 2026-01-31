interface Logo {
  name: string;
  logo: string;
  className: string;
}

interface SupportedLLMsProps {
  title?: string;
  subtitle?: string;
  logos?: Logo[];
}

const SupportedLLMs = ({
  title = "Supported LLMs",
  subtitle = "Our platform natively supports multiple Large Language Models (LLMs), enabling clients to choose the one that best fits their specific use case and compliance requirements.",
  logos = [
    {
      name: "blogic",
      logo: "/trusted-by/blogic-logo.avif",
      className: "h-8 w-auto",
    },
  ],
}: SupportedLLMsProps) => {
  return (
    <section className="pb-10">
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold">{title}</h2>
          <p className="mt-1 text-muted-foreground max-w-3xl mx-auto px-4 sm:px-0">
            {subtitle}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-6 lg:gap-12 px-4 sm:px-0">
            {[...logos, ...logos, ...logos, ...logos].map(
              (logo, index) => (
                <img
                  key={index}
                  src={logo.logo}
                  alt={`${logo.name} logo`}
                  title={logo.name}
                  width={109}
                  height={48}
                  className={logo.className}
                />
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export { SupportedLLMs };

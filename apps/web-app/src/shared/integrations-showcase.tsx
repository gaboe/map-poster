import { ArrowRight } from "lucide-react";

import { Button } from "@/shared/ui/button";

const images = [
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-1.svg",
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-2.svg",
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-3.svg",
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-4.svg",
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-5.svg",
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-6.svg",
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-7.svg",
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-8.svg",
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-9.svg",
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-10.svg",
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-11.svg",
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-12.svg",
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-13.svg",
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-14.svg",
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-15.svg",
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-16.svg",
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-17.svg",
  "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/integration/integration-18.svg",
];

const IntegrationsShowcase = () => {
  return (
    <section className="py-32">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-14 md:flex-row lg:gap-20">
          <div className="basis-1/2">
            <p className="font-mono text-sm text-muted-foreground">
              INTEGRATIONS
            </p>
            <h1 className="mt-4 mb-10 text-3xl font-bold text-pretty md:text-4xl">
              Explore integrations for your next project
            </h1>
            <p className="text-xl text-muted-foreground">
              Save time and get started quickly with
              pre-built integrations for your next project
              and make your life easier.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <Button>Get Started</Button>
              <Button variant="outline">
                Learn More <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
          <div className="flex basis-1/2 flex-wrap justify-center gap-2 md:max-w-xl md:justify-start">
            {images.map((image, index) => (
              <div key={index} className="relative size-20">
                <svg
                  viewBox="0 0 80 80"
                  className="text-muted-foreground/40"
                >
                  <path
                    fill="currentColor"
                    d="M75.43,79.22H4.57c-2.09,0-3.79-1.7-3.79-3.79V12.9c0-1,.4-1.98,1.11-2.68L10.22,1.89c.71-.71,1.68-1.11,2.68-1.11h62.54c2.09,0,3.79,1.7,3.79,3.79v70.87c0,2.09-1.7,3.79-3.79,3.79ZM12.9,1.78c-.73,0-1.45.3-1.97.82L2.59,10.92c-.52.52-.82,1.24-.82,1.97v62.54c0,1.54,1.25,2.79,2.79,2.79h70.87c1.54,0,2.79-1.25,2.79-2.79V4.57c0-1.54-1.25-2.79-2.79-2.79H12.9Z"
                  />
                </svg>
                <img
                  src={image}
                  alt="placeholder"
                  className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export { IntegrationsShowcase };

import AutoScroll from "embla-carousel-auto-scroll";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/shared/ui/carousel";

const TrustedBySection = () => {
  const logos = [
    {
      id: "blogic",
      description: "Blogic",
      image: "/trusted-by/blogic-logo.avif",
      className: "h-auto w-auto",
    },
  ];

  return (
    <section className="">
      <div className="container max-w-6xl mx-auto px-4 md:px-6">
        <h2 className="text-3xl font-bold text-center mb-4">
          Trusted by
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-3xl mx-auto">
          Trusted by startups and enterprises alike for
          delivering robust, scalable solutions, our
          platform enables organizations of all sizes to
          integrate quickly and grow with confidence.
        </p>

        <div className="relative mx-auto flex items-center justify-center pt-8">
          <Carousel
            opts={{ loop: true }}
            plugins={[AutoScroll({ playOnInit: true })]}
          >
            <CarouselContent className="ml-0">
              {[
                ...logos,
                ...logos,
                ...logos,
                ...logos,
                ...logos,
                ...logos,
                ...logos,
                ...logos,
              ].map((logo, index) => (
                <CarouselItem
                  key={`${logo.id}-${index}`}
                  className="h-35 border-border bg-primary-foreground dark:bg-foreground relative flex basis-1/2 justify-center border border-r-0 pl-0 sm:basis-1/4 md:basis-1/3 lg:basis-1/6"
                >
                  <div className="flex flex-col items-center justify-center lg:mx-10">
                    <img
                      src={logo.image}
                      alt={logo.description}
                      className={logo.className}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export { TrustedBySection };

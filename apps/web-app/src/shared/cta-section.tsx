import { Button } from "@/shared/ui/button";

const CtaSection = () => {
  return (
    <section className="py-10 md:py-12">
      <div className="flex items-center justify-center border bg-[url('https://deifkwefumgah.cloudfront.net/shadcnblocks/block/patterns/circles.svg')] dark:bg-none bg-cover bg-center py-20 text-center md:p-20">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-balance text-3xl font-semibold md:text-5xl px-4 sm:px-0">
              Start Programming with a Production-Ready
              Full-Stack Template Today
            </h2>
            <p className="md:text-lg px-4 sm:px-0">
              Everything you need is already configured -
              React 19, TanStack Start, TRPC, PostgreSQL,
              and deployment ready. Focus on building
              features, not infrastructure.
            </p>
            <div className="mt-11 flex flex-col justify-center gap-2 sm:flex-row px-4 sm:px-0">
              <Button
                size="lg"
                render={<a href="/contact" />}
              >
                Contact us
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { CtaSection };

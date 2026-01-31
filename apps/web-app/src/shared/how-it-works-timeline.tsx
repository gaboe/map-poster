const HowItWorksTimeline = () => {
  return (
    <section className="bg-background py-10 md:py-12">
      <div className="container max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tighter text-foreground sm:text-5xl">
            How it works
          </h2>
        </div>

        <div className="max-w-6xl mx-auto mt-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center space-x-4 p-6 rounded-lg bg-muted/50 h-32">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                  1
                </div>
                <div className="flex items-center h-full">
                  <p className="text-muted-foreground">
                    <strong>
                      Clone the repository and run dev.sh
                    </strong>{" "}
                    to initialize environment and install
                    dependencies with Bun
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-6 rounded-lg bg-muted/50 h-32">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                  2
                </div>
                <div className="flex items-center h-full">
                  <p className="text-muted-foreground">
                    <strong>
                      Configure environment variables
                    </strong>{" "}
                    and database connection in .env files
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center space-x-4 p-6 rounded-lg bg-muted/50 h-32">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                  3
                </div>
                <div className="flex items-center h-full">
                  <p className="text-muted-foreground">
                    <strong>
                      Start developing with hot reload
                    </strong>{" "}
                    using TanStack Start dev server with
                    full type safety
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-6 rounded-lg bg-muted/50 h-32">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                  4
                </div>
                <div className="flex items-center h-full">
                  <p className="text-muted-foreground">
                    <strong>Deploy to production</strong>{" "}
                    using pre-configured Docker and
                    Kubernetes manifests
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { HowItWorksTimeline };

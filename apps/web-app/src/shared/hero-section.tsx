import { MoveRight } from "lucide-react";

import { Button } from "@/shared/ui/button";
import logo from "@/assets/logo.png";
import { Link } from "@tanstack/react-router";

const HeroSection = () => {
  return (
    <section className="py-10 md:py-16">
      <div className="container max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center">
          <img
            src={logo}
            alt="map-poster logo"
            className="mx-auto mb-8 w-20 md:mb-10 md:w-24 lg:mb-12 lg:w-28"
          />
          <h1 className="mt-4 text-4xl font-semibold text-balance lg:text-6xl">
            This is a map-poster
          </h1>

          <Button
            render={<Link to="/app/dashboard" />}
            className="mt-6"
            size="lg"
          >
            Get Started
            <MoveRight className="ml-2" strokeWidth={1} />
          </Button>
        </div>
      </div>
    </section>
  );
};

export { HeroSection };

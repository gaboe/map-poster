import React from "react";

type Props = {
  logo: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  sections: Array<{
    title: string;
    links: Array<{ name: string; href: string }>;
  }>;
  description: string;
  socialLinks: Array<{
    icon: React.ReactElement;
    href: string;
    label: string;
  }>;
  copyright: string;
  legalLinks: Array<{
    name: string;
    href: string;
  }>;
};

const Footer = ({
  logo,
  sections,
  description,
  socialLinks,
  copyright,
  legalLinks,
}: Props) => {
  return (
    <section className="py-16 md:py-32">
      <div className="container">
        <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start text-center lg:text-left">
          <div className="flex w-full flex-col justify-between gap-6 items-center lg:items-start">
            {/* Logo */}
            <div className="flex items-center gap-2 justify-center lg:justify-start">
              <a
                href={logo.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  title={logo.title}
                  className="h-8"
                />
              </a>
              <h3 className="text-xl font-semibold">
                {logo.title}
              </h3>
            </div>
            <p className="text-muted-foreground max-w-full lg:max-w-[70%] text-sm text-center lg:text-left">
              {description}
            </p>
            <ul className="text-muted-foreground flex items-center justify-center lg:justify-start space-x-6">
              {socialLinks.map((social, idx) => (
                <li
                  key={idx}
                  className="hover:text-primary font-medium"
                >
                  <a
                    href={social.href}
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {social.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid w-full gap-6 md:grid-cols-3 lg:gap-20">
            {sections.map((section, sectionIdx) => (
              <div
                key={sectionIdx}
                className="text-center lg:text-left"
              >
                <h3 className="mb-4 font-bold">
                  {section.title}
                </h3>
                <ul className="text-muted-foreground space-y-3 text-sm">
                  {section.links.map((link, linkIdx) => (
                    <li
                      key={linkIdx}
                      className="hover:text-primary font-medium"
                    >
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="text-muted-foreground mt-8 flex flex-col justify-between gap-4 border-t py-8 text-xs font-medium md:flex-row md:items-center text-center md:text-left">
          <p className="order-2 lg:order-1">{copyright}</p>
          <ul className="order-1 flex flex-col gap-2 md:order-2 md:flex-row items-center">
            {legalLinks.map((link, idx) => (
              <li key={idx} className="hover:text-primary">
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {" "}
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export { Footer };

import {
  FaGithub,
  FaLinkedin,
  FaFacebook,
} from "react-icons/fa";
import logo from "@/assets/logo.png";
import { GradientBackground } from "@/shared/ui/gradient-background";

const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="none"
    viewBox="0 0 1200 1227"
    className="size-4"
  >
    <path
      fill="currentColor"
      d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z"
    />
  </svg>
);

const Footer = () => {
  const sections = [
    {
      title: "Product",
      links: [{ name: "Home", href: "/" }],
    },
    {
      title: "Company",
      links: [
        { name: "Newsroom", href: "/newsroom" },
        { name: "Contact", href: "/contact" },
      ],
    },
  ];

  const socialLinks = [
    {
      icon: <FaLinkedin className="size-5" />,
      href: "https://www.linkedin.com/company/blogic-software",
      label: "LinkedIn",
    },
    {
      icon: <FaFacebook className="size-5" />,
      href: "https://www.facebook.com/blogic/",
      label: "Facebook",
    },
    {
      icon: <XIcon />,
      href: "https://x.com/",
      label: "X.com",
    },
    {
      icon: <FaGithub className="size-5" />,
      href: "https://github.com/",
      label: "GitHub",
    },
  ];

  const legalLinks = [
    { name: "Terms of Service", href: "/tos" },
    { name: "Privacy Policy", href: "/privacy-policy" },
  ];

  return (
    <footer className="border-t relative">
      <GradientBackground variant="footer" />
      <div className="container py-8 md:py-16 max-w-6xl mx-auto relative z-10">
        <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start text-center lg:text-left mx-auto max-w-5xl">
          <div className="flex w-full flex-col justify-between gap-6 items-center lg:items-start">
            <div className="flex items-center gap-2 justify-center lg:justify-start">
              <img
                src={logo}
                alt="map-poster"
                className="h-8"
              />
              <h2 className="text-xl font-semibold">
                map-poster
              </h2>
            </div>
            <p className="text-muted-foreground max-w-full lg:max-w-[70%] text-sm text-center lg:text-left">
              Production-ready full-stack template with
              React 19, TanStack Start, and PostgreSQL.
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
                      <a href={link.href}>{link.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="text-muted-foreground mt-8 flex flex-col justify-between gap-4 border-t py-8 text-xs font-medium md:flex-row md:items-center text-center md:text-left max-w-5xl mx-auto">
          <p className="order-2 lg:order-1">
            © {new Date().getFullYear()} map-poster. All
            rights reserved.
          </p>
          <ul className="order-1 flex flex-col gap-2 md:order-2 md:flex-row md:gap-4 items-center">
            {legalLinks.map((link, idx) => (
              <li key={idx} className="hover:text-primary">
                <a href={link.href}>{link.name}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export { Footer };

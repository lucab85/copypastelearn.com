import { COURSE_TRACKS } from "@/lib/course-tracks";

/**
 * Link columns. Static on purpose: the footer is on every page, including
 * the dynamic ones, so it reads neither the database nor the blog folder.
 * tests/unit/home-catalog.test.ts checks that every track and article
 * category linked here exists.
 */
export const footerSections = [
  {
    title: "Courses",
    links: [
      { href: "/courses", label: "All courses" },
      ...COURSE_TRACKS.filter((t) => t.id !== "OTHER").map((t) => ({
        href: `/courses#${t.anchor}`,
        label: t.title,
      })),
      { href: "/academy", label: "Agentic AI Academy" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Articles by topic",
    links: [
      { href: "/blog/category/devops", label: "DevOps" },
      { href: "/blog/category/openclaw", label: "OpenClaw" },
      { href: "/blog/category/ai-tools", label: "AI Tools" },
      { href: "/blog/category/development", label: "Development" },
      { href: "/blog/category/mlops", label: "MLOps" },
      { href: "/blog", label: "All articles" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/shop", label: "Shop" },
      { href: "/ai-platform-engineering", label: "AI for Leaders" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/refund-policy", label: "Refund policy" },
      { href: "/digital-delivery-policy", label: "Digital delivery" },
    ],
  },
];

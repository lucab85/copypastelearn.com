/**
 * Learner testimonials. Real quotes (confirmed by Luca, Nov 2026), word for
 * word as they were on the home page before the redesign: do not edit a
 * quote, and do not add a photo, a title or a company a learner did not give.
 */
export interface Testimonial {
  name: string;
  role: string;
  company: string;
  text: string;
  outcome: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Marco R.",
    role: "DevOps Engineer",
    company: "Cloud Infrastructure Team",
    text: "The hands-on labs made Ansible click for me in a way video-only courses never could. I automated our entire server provisioning in week 1.",
    outcome: "Automated server provisioning in 1 week",
  },
  {
    name: "Sarah K.",
    role: "Backend Developer",
    company: "SaaS Startup",
    text: "Finally a platform that lets me practice Docker commands in a real environment, not just read about them. Shipped my first containerized app in 3 days.",
    outcome: "Containerized first app in 3 days",
  },
  {
    name: "James L.",
    role: "SRE",
    company: "Fintech Company",
    text: "I went from zero to deploying containerized services in production after the Docker Fundamentals course. The copy-paste workflow is genius.",
    outcome: "Production deployment in 2 weeks",
  },
];

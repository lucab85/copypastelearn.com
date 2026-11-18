/**
 * Home page FAQ. Every answer restates something another page of the site
 * already says (`source`); nothing here is new policy. Keep the wording in
 * step with those pages when they change.
 */
export interface FaqItem {
  question: string;
  answer: string;
  /** A page with the full answer. */
  link?: { href: string; label: string };
  /** Where the answer comes from (for whoever edits this next). */
  source: string;
}

export const HOME_FAQ: FaqItem[] = [
  {
    question: "Can I try a course before paying?",
    answer:
      "Yes. The first lesson of every course is free. No signup, no card.",
    link: { href: "/courses", label: "Browse the courses" },
    source: "home page hero, /pricing",
  },
  {
    question: "How do the lessons work?",
    answer:
      "They are short video lessons where every command is on screen. You watch the commands run, then repeat them in your own environment. Where a course has a final assessment, you can take it at the end.",
    source: "home page, /academy",
  },
  {
    question: "Do I have to take the courses in order?",
    answer:
      "No. Every course stands alone: pick a track and start from any course.",
    link: { href: "/courses", label: "See the tracks" },
    source: "/courses, course-tracks.ts",
  },
  {
    question: "Where can I ask a question?",
    answer:
      "Join the community on Discord or write to us by email. Both are on the contact page.",
    link: { href: "/contact", label: "Contact and community" },
    source: "/contact",
  },
  {
    question: "What does a subscription include?",
    answer:
      "A subscription unlocks every lesson and the available final assessments. It includes all current and future courses.",
    link: { href: "/pricing", label: "See pricing" },
    source: "/pricing",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. There is no long-term commitment. Cancelling stops the next renewal, and you keep access until the end of the period you have already paid for.",
    link: { href: "/refund-policy", label: "Read the refund policy" },
    source: "/pricing FAQ, /refund-policy section 4",
  },
  {
    question: "Can I get a refund?",
    answer:
      "The refund policy has the full terms. In short, for subscriptions: if you cancel within 14 days of your first paid period and have not watched more than the first lesson of any course, the period is refunded in full. Unused parts of a paid period are not refunded, except where the law requires it.",
    link: { href: "/refund-policy", label: "Read the refund policy" },
    source: "/refund-policy section 4",
  },
];

/**
 * Home page FAQ. Every sentence restates something the site already says or
 * does; `source` names the file (or page section) it was checked against on
 * 2026-11-18. Nothing here is new policy and no price is stated (plans and
 * prices come from Clerk Billing, not from this repository). When one of the
 * sources changes, change the answer with it.
 */
export interface FaqItem {
  question: string;
  answer: string;
  /** A page with the full answer. */
  link?: { href: string; label: string };
  /** Where each sentence comes from. */
  source: string;
}

export const HOME_FAQ: FaqItem[] = [
  {
    question: "Can I try a course before paying?",
    answer:
      "Yes. The first lesson of a course is free and plays without an account or a card. It has a “Free” badge in the lesson list on the course page.",
    link: { href: "/courses", label: "Browse the courses" },
    source:
      "server/queries/lessons.ts (lesson with sortOrder 0 is free, no user needed); middleware.ts (/courses is public); pricing page header and FAQ; course page lesson list (Free badge)",
  },
  {
    question: "How do the lessons work?",
    answer:
      "They are short video lessons where every command is on screen. You watch the commands run and repeat them in your own environment. Some courses also have a final assessment for subscribers.",
    source:
      "components/home/promo-bento.tsx (hero text); /academy intro; pricing page header; components/course/paywall.tsx; server/queries/course-extras.ts (assessment is subscriber-only)",
  },
  {
    question: "Do I have to take the courses in order?",
    answer:
      "No. Pick a track and start from any course. The Agentic AI Academy page lists its courses in a suggested order.",
    link: { href: "/courses", label: "See the tracks" },
    source:
      "/courses header; lib/course-tracks.ts (AI Homelab); lib/academy.ts and /academy (Course 1, Course 2, ...)",
  },
  {
    question: "Where can I ask a question?",
    answer: "Write to us by email. The address is on the contact page.",
    link: { href: "/contact", label: "Contact" },
    source: "/contact (Email card)",
  },
  {
    question: "What does a subscription include?",
    answer:
      "A subscription unlocks every lesson and the available final assessments, and it includes all current and future courses. The plans are on the pricing page.",
    link: { href: "/pricing", label: "See pricing" },
    source:
      "pricing page header and FAQ (“Do I get access to new courses?”); components/course/paywall.tsx; lib/billing.ts (plan “pro”)",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. There is no long-term commitment. Cancelling stops the next renewal, and you keep access until the end of the period you have already paid for.",
    link: { href: "/refund-policy", label: "Read the refund policy" },
    source:
      "pricing page FAQ (“Can I cancel anytime?”); /refund-policy section 4; /terms section 5",
  },
  {
    question: "Can I get a refund?",
    answer:
      "Refunds follow the refund policy. The first paid period of a subscription can be refunded in full within 14 days, under the conditions listed in section 4 of the policy. Unused parts of a paid period are not refunded, except where the law requires it.",
    link: { href: "/refund-policy", label: "Read the refund policy" },
    source: "/refund-policy section 4; /terms section 5",
  },
];

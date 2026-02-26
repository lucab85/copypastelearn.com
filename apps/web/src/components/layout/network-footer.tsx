const networkSites = [
  {
    href: "https://lucaberton.com/",
    title: "AI & Cloud Advisor",
    label: "Luca Berton",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[18px] w-[18px] shrink-0">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    href: "https://www.ansiblepilot.com/",
    title: "772+ Ansible Tutorials",
    label: "Ansible Pilot",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[18px] w-[18px] shrink-0">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    href: "https://www.ansiblebyexample.com/",
    title: "Ansible Books & Resources",
    label: "Ansible by Example",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[18px] w-[18px] shrink-0">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    href: "https://www.openempower.com/",
    title: "AI Platform Engineering Consultancy",
    label: "Open Empower",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[18px] w-[18px] shrink-0">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    href: "https://kubernetes.recipes/",
    title: "Kubernetes Recipe Book",
    label: "K8s Recipes",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[18px] w-[18px] shrink-0">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    href: "https://www.terraformpilot.com/",
    title: "Terraform Automation Mastery",
    label: "Terraform Pilot",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[18px] w-[18px] shrink-0">
        <rect x="2" y="2" width="20" height="8" rx="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
  },
  {
    href: "https://www.copypastelearn.com/",
    title: "Learn IT by Doing",
    label: "CopyPasteLearn",
    active: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[18px] w-[18px] shrink-0">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    href: "https://www.proteinlens.com/",
    title: "AI Macro Nutrition Tracker",
    label: "ProteinLens",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[18px] w-[18px] shrink-0">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
];

export function NetworkFooter() {
  return (
    <div className="border-t-2 border-primary bg-[#0f172a] px-4 py-6 text-center">
      <p className="mb-3.5 text-[13px] font-semibold uppercase tracking-wider text-slate-400">
        🌐 Luca Berton Network
      </p>
      <div className="mx-auto flex max-w-[720px] flex-wrap justify-center gap-2.5">
        {networkSites.map((site) => (
          <a
            key={site.href}
            href={site.href}
            title={site.title}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[13px] font-medium text-slate-200 transition-all hover:-translate-y-px hover:border-primary hover:bg-primary hover:text-white hover:shadow-[0_4px_12px_rgba(59,130,246,.3)] ${
              site.active
                ? "border-primary bg-[#1e3a5f]"
                : "border-slate-700 bg-slate-800"
            }`}
          >
            {site.icon}
            {site.label}
          </a>
        ))}
      </div>
    </div>
  );
}

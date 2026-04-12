const networkSites = [
  {
    href: "https://lucaberton.com/",
    label: "Luca Berton",
    title: "AI & Cloud Advisor",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    href: "https://www.ansiblepilot.com/",
    label: "Ansible Pilot",
    title: "772+ Ansible Tutorials",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    href: "https://www.ansiblebyexample.com/",
    label: "Ansible by Example",
    title: "Ansible Books & Resources",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    href: "https://www.openempower.com/",
    label: "Open Empower",
    title: "AI Platform Engineering Consultancy",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    href: "https://kubernetes.recipes/",
    label: "K8s Recipes",
    title: "Kubernetes Recipe Book",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    href: "https://www.terraformpilot.com/",
    label: "Terraform Pilot",
    title: "Terraform Automation Mastery",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
        <rect x="2" y="2" width="20" height="8" rx="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
  },
  {
    href: "https://www.copypastelearn.com/",
    label: "CopyPasteLearn",
    title: "Learn IT by Doing",
    active: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    href: "https://www.proteinlens.com/",
    label: "ProteinLens",
    title: "AI Macro Nutrition Tracker",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
  {
    href: "https://www.heavenartshop.com/",
    label: "Heaven Art Shop",
    title: "Sacred Lithographs & African Oil Paintings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 12l10 5 10-5" />
        <path d="M12 22l-10-5" />
        <path d="M12 22l10-5" />
      </svg>
    ),
  },
  {
    href: "https://www.techmeout.it/",
    label: "TechMeOut",
    title: "Professional Web Development",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];

export function NetworkFooter() {
  return (
    <div className="border-t border-white/5 bg-[#0a0a0b] px-4 py-3">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1">
        {networkSites.map((site) => (
          <a
            key={site.href}
            href={site.href}
            title={site.title}
            className={`inline-flex items-center gap-1 whitespace-nowrap text-[11px] no-underline transition-colors duration-200 ${
              site.active
                ? "pointer-events-none text-white/50"
                : "text-white/35 hover:text-white/65"
            }`}
            {...(!site.active && {
              target: "_blank",
              rel: "noopener",
            })}
          >
            {site.icon}
            {site.label}
          </a>
        ))}
      </div>
    </div>
  );
}

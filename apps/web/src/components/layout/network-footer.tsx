const networkSites = [
  { href: "https://lucaberton.com/", label: "Luca Berton" },
  { href: "https://www.ansiblepilot.com/", label: "Ansible Pilot" },
  { href: "https://www.ansiblebyexample.com/", label: "Ansible by Example" },
  { href: "https://www.openempower.com/", label: "Open Empower" },
  { href: "https://kubernetes.recipes/", label: "K8s Recipes" },
  { href: "https://www.terraformpilot.com/", label: "Terraform Pilot" },
  { href: "https://www.copypastelearn.com/", label: "CopyPasteLearn", active: true },
  { href: "https://www.proteinlens.com/", label: "ProteinLens" },
  { href: "https://www.techmeout.it/", label: "TechMeOut" },
];

export function NetworkFooter() {
  return (
    <div className="px-4 py-2.5 text-center">
      <div className="mx-auto flex max-w-[720px] flex-wrap justify-center gap-x-1.5 gap-y-1">
        {networkSites.map((site, i) => (
          <span key={site.href} className="inline-flex items-center">
            {i > 0 && <span className="mr-1.5 text-[10px] opacity-25">·</span>}
            <a
              href={site.href}
              title={site.label}
              className={`text-[10px] no-underline transition-opacity duration-200 ${
                site.active ? "opacity-50" : "opacity-40 hover:opacity-70"
              }`}
              style={{ color: "inherit" }}
            >
              {site.label}
            </a>
          </span>
        ))}
      </div>
    </div>
  );
}

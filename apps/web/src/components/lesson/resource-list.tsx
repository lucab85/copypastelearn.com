import { ExternalLink, Download } from "lucide-react";

interface Resource {
  title: string;
  url: string;
  type: string;
}

interface ResourceListProps {
  resources: Resource[];
}

export function ResourceList({ resources }: ResourceListProps) {
  if (resources.length === 0) return null;

  return (
    <div className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold">Resources</h3>
      </div>
      <ul className="divide-y">
        {resources.map((resource, index) => (
          <li key={index}>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
            >
              {resource.type === "download" ? (
                <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{resource.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {resource.type}
                </p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

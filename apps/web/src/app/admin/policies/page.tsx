import { listPolicyVersions } from "@/server/actions/admin/policies";
import { Badge } from "@/components/ui/badge";
import { PolicyEditor } from "./editor";

export const metadata = { title: "Policies" };
export const dynamic = "force-dynamic";

export default async function AdminPoliciesPage() {
  const versions = await listPolicyVersions();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Policies</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Versioned legal documents (FR-047). Past versions remain queryable
          for legal recordkeeping.
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          New / edit version
        </h2>
        <div className="mt-3">
          <PolicyEditor />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Versions
        </h2>
        {versions.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            No policies yet. Run the commerce seed or create one above.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {versions.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between p-3 text-sm"
              >
                <span>
                  <strong>{v.slug}</strong>{" "}
                  <span className="text-zinc-500">@</span> {v.version}
                </span>
                <span className="flex items-center gap-2">
                  {v.isCurrent ? <Badge>current</Badge> : null}
                  <span className="text-xs text-zinc-500">
                    {v.publishedAt.toLocaleDateString()}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

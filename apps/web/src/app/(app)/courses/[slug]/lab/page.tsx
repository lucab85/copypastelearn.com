export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCourseLabGuide } from "@/server/queries/course-extras";
import { MemberGate } from "@/components/course/member-gate";
import { SimpleMarkdown } from "@/components/course/simple-markdown";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Hands-On Lab",
  robots: { index: false, follow: false },
};

export default async function LabGuidePage({ params }: Props) {
  const { slug } = await params;
  const view = await getCourseLabGuide(slug);
  if (!view) notFound();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <Link
        href={`/courses/${slug}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {view.courseTitle}
      </Link>
      {view.access === "ok" && view.labGuide ? (
        <SimpleMarkdown source={view.labGuide} />
      ) : (
        <>
          <h1 className="mb-8 text-3xl font-bold tracking-tight">Hands-On Lab</h1>
          <MemberGate
            access={view.access === "ok" ? "no-subscription" : view.access}
            what="The hands-on lab"
            returnTo={`/courses/${slug}/lab`}
          />
        </>
      )}
    </div>
  );
}

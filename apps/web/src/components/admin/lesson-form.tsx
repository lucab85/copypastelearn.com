"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createLesson,
  updateLesson,
  publishLesson,
  unpublishLesson,
} from "@/server/actions/admin";
import { Save, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LessonFormProps {
  courseId: string;
  lesson?: {
    id: string;
    title: string;
    description: string;
    videoPlaybackId: string | null;
    transcript: string | null;
    codeSnippets: unknown;
    resources: unknown;
    durationSeconds: number | null;
    status: string;
  };
}

export function LessonForm({ courseId, lesson }: LessonFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const [videoPlaybackId, setVideoPlaybackId] = useState(
    lesson?.videoPlaybackId ?? ""
  );
  const [transcript, setTranscript] = useState(lesson?.transcript ?? "");
  const [codeSnippets, setCodeSnippets] = useState(
    lesson?.codeSnippets ? JSON.stringify(lesson.codeSnippets, null, 2) : "[]"
  );
  const [resources, setResources] = useState(
    lesson?.resources ? JSON.stringify(lesson.resources, null, 2) : "[]"
  );
  const [durationSeconds, setDurationSeconds] = useState(
    lesson?.durationSeconds?.toString() ?? ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let parsedSnippets;
    let parsedResources;
    try {
      parsedSnippets = JSON.parse(codeSnippets);
      parsedResources = JSON.parse(resources);
    } catch {
      setError("Invalid JSON in code snippets or resources");
      return;
    }

    const data = {
      title,
      description,
      videoPlaybackId: videoPlaybackId || null,
      transcript: transcript || null,
      codeSnippets: parsedSnippets,
      resources: parsedResources,
      durationSeconds: durationSeconds ? parseInt(durationSeconds) : null,
    };

    startTransition(async () => {
      const result = lesson
        ? await updateLesson(lesson.id, data)
        : await createLesson(courseId, data);

      if ("error" in result && result.error) {
        setError(String(result.error));
        return;
      }

      if (result.data && !lesson) {
        router.push(`/admin/courses/${courseId}/lessons/${result.data.id}`);
      } else {
        router.refresh();
      }
    });
  };

  const handlePublishToggle = () => {
    if (!lesson) return;
    startTransition(async () => {
      if (lesson.status === "PUBLISHED") {
        await unpublishLesson(lesson.id);
      } else {
        await publishLesson(lesson.id);
      }
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{lesson ? "Edit Lesson" : "New Lesson"}</CardTitle>
            {lesson && (
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    lesson.status === "PUBLISHED" ? "default" : "secondary"
                  }
                >
                  {lesson.status.toLowerCase()}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePublishToggle}
                  disabled={isPending}
                >
                  {lesson.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Mux Playback ID
            </label>
            <Input
              value={videoPlaybackId}
              onChange={(e) => setVideoPlaybackId(e.target.value)}
              placeholder="e.g. 6s1VkSmpxDoVdDaTaaIoYPChTfdGTKpWR"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Duration (seconds)
            </label>
            <Input
              type="number"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(e.target.value)}
              placeholder="360"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Transcript
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
              rows={6}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Code Snippets (JSON)
            </label>
            <textarea
              value={codeSnippets}
              onChange={(e) => setCodeSnippets(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
              rows={6}
              placeholder='[{"label": "Example", "language": "typescript", "code": "console.log(\"hello\")"}]'
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Resources (JSON)
            </label>
            <textarea
              value={resources}
              onChange={(e) => setResources(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
              rows={4}
              placeholder='[{"title": "Docs", "url": "https://..."}]'
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {lesson ? "Save Changes" : "Create Lesson"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

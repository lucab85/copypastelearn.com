"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCourse, updateCourse } from "@/server/actions/admin";
import { Save, Loader2 } from "lucide-react";

interface CourseFormProps {
  course?: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    outcomes: string[];
    prerequisites: string[];
    estimatedDuration: string | null;
    sortOrder: number;
  };
}

export function CourseForm({ course }: CourseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [difficulty, setDifficulty] = useState(course?.difficulty ?? "BEGINNER");
  const [outcomes, setOutcomes] = useState(
    course?.outcomes?.join("\n") ?? ""
  );
  const [prerequisites, setPrerequisites] = useState(
    course?.prerequisites?.join("\n") ?? ""
  );
  const [estimatedDuration, setEstimatedDuration] = useState(
    course?.estimatedDuration ?? ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const data = {
      title,
      description,
      difficulty,
      outcomes: outcomes
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      prerequisites: prerequisites
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      estimatedDuration: estimatedDuration || null,
    };

    startTransition(async () => {
      const result = course
        ? await updateCourse(course.id, data)
        : await createCourse(data);

      if ("error" in result && result.error) {
        setError(String(result.error));
        return;
      }

      if (result.data && !course) {
        router.push(`/admin/courses/${result.data.id}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{course ? "Edit Course" : "New Course"}</CardTitle>
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
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Outcomes (one per line)
            </label>
            <textarea
              value={outcomes}
              onChange={(e) => setOutcomes(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={4}
              placeholder="Build a REST API with Node.js&#10;Deploy containers with Docker"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Prerequisites (one per line)
            </label>
            <textarea
              value={prerequisites}
              onChange={(e) => setPrerequisites(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={3}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Estimated Duration
            </label>
            <Input
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              placeholder="e.g. 4 hours"
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
            {course ? "Save Changes" : "Create Course"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { upsertLabDefinition } from "@/server/actions/admin";
import { Save, Loader2, Terminal, CheckCircle2, XCircle } from "lucide-react";

interface LabDefinitionEditorProps {
  lessonId: string;
  labDefinition: {
    title: string;
    description: string | null;
    yamlConfig: string;
    dockerImage: string;
    memoryLimit: string | null;
    cpuLimit: string | null;
  } | null;
}

export function LabDefinitionEditor({
  lessonId,
  labDefinition,
}: LabDefinitionEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<
    "idle" | "valid" | "invalid"
  >("idle");

  const [title, setTitle] = useState(labDefinition?.title ?? "");
  const [description, setDescription] = useState(
    labDefinition?.description ?? ""
  );
  const [yamlConfig, setYamlConfig] = useState(
    labDefinition?.yamlConfig ?? ""
  );
  const [dockerImage, setDockerImage] = useState(
    labDefinition?.dockerImage ?? ""
  );
  const [memoryLimit, setMemoryLimit] = useState(
    labDefinition?.memoryLimit ?? ""
  );
  const [cpuLimit, setCpuLimit] = useState(labDefinition?.cpuLimit ?? "");

  const handleValidate = () => {
    try {
      JSON.parse(yamlConfig);
      setValidationStatus("valid");
      setError(null);
    } catch {
      setValidationStatus("invalid");
      setError("Invalid JSON in YAML config");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await upsertLabDefinition(lessonId, {
        title,
        description: description || null,
        yamlConfig,
        dockerImage,
        memoryLimit: memoryLimit || null,
        cpuLimit: cpuLimit || null,
      });

      if ("error" in result && result.error) {
        setError(String(result.error));
      } else {
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Lab Definition
            {labDefinition && (
              <Badge variant="outline" className="text-xs">
                configured
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Lab Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Build a REST API"
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
              rows={2}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Docker Image
            </label>
            <Input
              value={dockerImage}
              onChange={(e) => setDockerImage(e.target.value)}
              required
              placeholder="e.g. node:20-slim"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Memory Limit
              </label>
              <Input
                value={memoryLimit}
                onChange={(e) => setMemoryLimit(e.target.value)}
                placeholder="e.g. 256m"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                CPU Limit
              </label>
              <Input
                value={cpuLimit}
                onChange={(e) => setCpuLimit(e.target.value)}
                placeholder="e.g. 0.5"
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium">
                Lab Config (JSON)
              </label>
              <div className="flex items-center gap-2">
                {validationStatus === "valid" && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="h-3 w-3" /> Valid
                  </span>
                )}
                {validationStatus === "invalid" && (
                  <span className="flex items-center gap-1 text-xs text-red-600">
                    <XCircle className="h-3 w-3" /> Invalid
                  </span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleValidate}
                >
                  Validate
                </Button>
              </div>
            </div>
            <textarea
              value={yamlConfig}
              onChange={(e) => {
                setYamlConfig(e.target.value);
                setValidationStatus("idle");
              }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
              rows={12}
              placeholder='{"steps": [{"title": "Step 1", "instructions": "...", "checks": [...]}]}'
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
            {labDefinition ? "Update Lab" : "Create Lab"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

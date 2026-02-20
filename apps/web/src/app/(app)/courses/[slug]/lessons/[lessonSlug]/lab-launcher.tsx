import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, Construction } from "lucide-react";

interface LabLauncherProps {
  labDefinitionId: string;
  courseSlug: string;
  lessonSlug: string;
}

export function LabLauncher({
  labDefinitionId,
  courseSlug,
  lessonSlug,
}: LabLauncherProps) {
  return (
    <Card className="border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Terminal className="h-4 w-4" />
          Interactive Lab
          <Badge variant="outline" className="ml-auto text-[10px] font-medium uppercase tracking-wider border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400">
            <Construction className="mr-1 h-3 w-3" />
            Coming Soon
          </Badge>
        </CardTitle>
        <CardDescription>
          Practice what you&apos;ve learned in a real Linux environment with guided exercises and automatic validation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Hands-on labs are being set up and will be available shortly. Stay tuned!
        </p>
      </CardContent>
    </Card>
  );
}

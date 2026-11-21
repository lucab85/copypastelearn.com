"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { VideoPlayer } from "@/components/lesson/video-player";
import { saveVideoPosition, markLessonComplete } from "@/server/actions/progress";
import { trackLessonComplete } from "@/lib/analytics";

interface MuxTokens {
  playback: string;
  thumbnail: string;
  storyboard: string;
}

interface LessonPlayerClientProps {
  lessonId: string;
  playbackId: string;
  tokens?: MuxTokens;
  title: string;
  startTime: number;
  isCompleted: boolean;
  courseSlug?: string;
  lessonSlug?: string;
  /** Shown under the video and brought into view when it ends. */
  children?: ReactNode;
}

export function LessonPlayerClient({
  lessonId,
  playbackId,
  tokens,
  title,
  startTime,
  isCompleted,
  courseSlug,
  lessonSlug,
  children,
}: LessonPlayerClientProps) {
  const [ended, setEnded] = useState(false);
  const afterVideo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ended) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    afterVideo.current?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
  }, [ended]);

  const handleTimeUpdate = useCallback(
    async (currentTime: number) => {
      try {
        await saveVideoPosition(lessonId, currentTime);
      } catch {
        // Silently fail — position save is best-effort
      }
    },
    [lessonId]
  );

  const handleEnded = useCallback(async () => {
    setEnded(true);
    if (!isCompleted) {
      try {
        await markLessonComplete(lessonId);
        if (courseSlug && lessonSlug) {
          trackLessonComplete(courseSlug, lessonSlug);
        }
      } catch {
        // Silently fail
      }
    }
  }, [lessonId, isCompleted, courseSlug, lessonSlug]);

  return (
    <>
      <VideoPlayer
        playbackId={playbackId}
        tokens={tokens}
        title={title}
        startTime={startTime}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        courseSlug={courseSlug}
        lessonSlug={lessonSlug}
      />
      {children && (
        <div
          ref={afterVideo}
          className={cn("mt-6 rounded-xl transition-shadow", ended && "ring-2 ring-primary ring-offset-2 ring-offset-background")}
        >
          {children}
        </div>
      )}
    </>
  );
}

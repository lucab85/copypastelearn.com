"use client";

import { useCallback } from "react";
import { VideoPlayer } from "@/components/lesson/video-player";
import { saveVideoPosition, markLessonComplete } from "@/server/actions/progress";

interface LessonPlayerClientProps {
  lessonId: string;
  playbackId: string;
  title: string;
  startTime: number;
  isCompleted: boolean;
}

export function LessonPlayerClient({
  lessonId,
  playbackId,
  title,
  startTime,
  isCompleted,
}: LessonPlayerClientProps) {
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
    if (!isCompleted) {
      try {
        await markLessonComplete(lessonId);
      } catch {
        // Silently fail
      }
    }
  }, [lessonId, isCompleted]);

  return (
    <VideoPlayer
      playbackId={playbackId}
      title={title}
      startTime={startTime}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
    />
  );
}

"use client";

import MuxPlayer from "@mux/mux-player-react";
import { useCallback, useRef } from "react";

interface MuxTokens {
  video: string;
  thumbnail: string;
  storyboard: string;
}

interface VideoPlayerProps {
  playbackId: string;
  tokens?: MuxTokens;
  title?: string;
  startTime?: number;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
}

export function VideoPlayer({
  playbackId,
  tokens,
  title,
  startTime = 0,
  onTimeUpdate,
  onEnded,
}: VideoPlayerProps) {
  const lastReportedTime = useRef(0);

  const handleTimeUpdate = useCallback(
    (event: Event) => {
      const player = event.target as HTMLVideoElement;
      const currentTime = Math.floor(player.currentTime);

      // Debounce: only report every 5 seconds
      if (Math.abs(currentTime - lastReportedTime.current) >= 5) {
        lastReportedTime.current = currentTime;
        onTimeUpdate?.(currentTime);
      }
    },
    [onTimeUpdate]
  );

  const handleEnded = useCallback(() => {
    onEnded?.();
  }, [onEnded]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <MuxPlayer
        playbackId={playbackId}
        tokens={tokens}
        metadata={{
          video_title: title ?? "Lesson Video",
        }}
        startTime={startTime}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        streamType="on-demand"
        accentColor="#000000"
        className="h-full w-full"
      />
    </div>
  );
}

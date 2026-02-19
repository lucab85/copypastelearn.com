"use client";

import MuxPlayer from "@mux/mux-player-react";
import { useCallback, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

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
  const [hasError, setHasError] = useState(false);
  // If tokens fail (e.g. public playback ID), retry without them
  const [useTokens, setUseTokens] = useState(true);

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

  const handleError = useCallback(() => {
    if (tokens && useTokens) {
      // First failure with tokens — retry as public playback
      console.warn(
        "[video-player] Playback failed with signed tokens; retrying without tokens (public playback)."
      );
      setUseTokens(false);
    } else {
      setHasError(true);
    }
  }, [tokens, useTokens]);

  if (hasError) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-lg bg-muted text-muted-foreground">
        <AlertTriangle className="h-10 w-10 text-yellow-500" />
        <p className="text-sm font-medium">Video unavailable</p>
        <p className="max-w-md text-center text-xs">
          The video for this lesson could not be loaded. This may be because the
          Mux playback ID is not configured or the signing keys are missing.
        </p>
      </div>
    );
  }

  const activeTokens = useTokens ? tokens : undefined;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <MuxPlayer
        key={useTokens ? "signed" : "public"}
        playbackId={playbackId}
        tokens={activeTokens}
        metadata={{
          video_title: title ?? "Lesson Video",
        }}
        startTime={startTime}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        streamType="on-demand"
        accentColor="#000000"
        className="h-full w-full"
      />
    </div>
  );
}

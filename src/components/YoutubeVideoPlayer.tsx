"use client";
import React, { useCallback, useEffect, useRef } from "react";
import Youtube, { YouTubeEvent, YouTubePlayer } from "react-youtube";

const YoutubeVideoPlayer = ({
  videoId,
  onFinishedVideo,
  initialPositionSeconds = 0,
  onProgress,
}: {
  videoId: string;
  onFinishedVideo?: () => void;
  initialPositionSeconds?: number;
  onProgress?: (positionSeconds: number, durationSeconds: number) => void;
}) => {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reportProgress = useCallback(() => {
    const player = playerRef.current;
    if (!player || !onProgress) return;

    const position = Number(player.getCurrentTime?.() ?? 0);
    const duration = Number(player.getDuration?.() ?? 0);
    onProgress(position, duration);
  }, [onProgress]);

  const handleReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;

    if (initialPositionSeconds > 0) {
      event.target.seekTo(initialPositionSeconds, true);
    }

    intervalRef.current = setInterval(reportProgress, 10000);
  };

  useEffect(() => {
    const player = playerRef.current;
    if (!player || initialPositionSeconds <= 0) return;

    const currentPosition = Number(player.getCurrentTime?.() ?? 0);
    if (currentPosition < 5) {
      player.seekTo(initialPositionSeconds, true);
    }
  }, [initialPositionSeconds]);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      reportProgress();
    },
    [reportProgress],
  );

  return (
    <Youtube
      videoId={videoId}
      onReady={handleReady}
      onPause={reportProgress}
      onEnd={() => {
        reportProgress();
        onFinishedVideo?.();
      }}
      className="w-full h-full"
      opts={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};

export default YoutubeVideoPlayer;

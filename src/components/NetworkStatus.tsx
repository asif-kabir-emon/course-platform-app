"use client";

import { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { onlineManager } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

const getIsOnline = () =>
  typeof navigator === "undefined" ? true : navigator.onLine;

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = (online = getIsOnline()) => {
      setIsOnline(online);
      onlineManager.setOnline(online);
    };

    const handleOnline = () => updateOnlineStatus(true);
    const handleOffline = () => updateOnlineStatus(false);
    const handleNetworkError = () => updateOnlineStatus(false);

    updateOnlineStatus();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("app:network-offline", handleNetworkError);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("app:network-offline", handleNetworkError);
    };
  }, []);

  const handleRetry = () => {
    setIsChecking(true);

    window.setTimeout(() => {
      const online = getIsOnline();
      setIsOnline(online);
      onlineManager.setOnline(online);
      setIsChecking(false);

      if (online) {
        window.location.reload();
      }
    }, 450);
  };

  if (isOnline) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 px-4 py-8 backdrop-blur-md"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 text-center shadow-2xl shadow-slate-950/10 sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <WifiOff className="h-8 w-8" aria-hidden="true" />
        </div>

        <div className="mt-6 space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            No network connection
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Your internet connection appears to be offline. Reconnect to keep
            learning and continue from where you left off.
          </p>
        </div>

        <Button
          className="mt-6 w-full"
          onClick={handleRetry}
          disabled={isChecking}
        >
          <RefreshCw
            className={isChecking ? "animate-spin" : ""}
            aria-hidden="true"
          />
          {isChecking ? "Checking connection" : "Try again"}
        </Button>
      </div>
    </div>
  );
};

export default NetworkStatus;

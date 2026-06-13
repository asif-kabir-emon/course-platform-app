"use client";

import {
  authSessionChangedEvent,
  getClientSession,
} from "@/lib/clientSession";
import type { jwtPayload } from "@/types";
import { useEffect, useState } from "react";

export const useClientSession = () => {
  const [session, setSession] = useState<jwtPayload | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const refreshSession = () => {
      setSession(getClientSession());
      setIsReady(true);
    };

    refreshSession();
    window.addEventListener(authSessionChangedEvent, refreshSession);

    return () => {
      window.removeEventListener(authSessionChangedEvent, refreshSession);
    };
  }, []);

  return { session, isReady };
};

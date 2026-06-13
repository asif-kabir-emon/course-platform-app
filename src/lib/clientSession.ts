"use client";

import { authKey } from "@/constants/AuthKey.constant";
import type { jwtPayload } from "@/types";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";

export const authSessionChangedEvent = "auth-session-changed";

export const getClientSession = (): jwtPayload | null => {
  const token = Cookies.get(authKey);

  if (!token) {
    return null;
  }

  try {
    const payload = decodeJwt(token) as jwtPayload;

    if (!payload.id || !payload.email || !payload.role) {
      return null;
    }

    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      clearClientSession();
      return null;
    }

    return payload;
  } catch {
    clearClientSession();
    return null;
  }
};

export const notifyClientSessionChanged = () => {
  window.dispatchEvent(new Event(authSessionChangedEvent));
};

export const clearClientSession = () => {
  Cookies.remove(authKey, { path: "/" });

  if (typeof window !== "undefined") {
    sessionStorage.removeItem(authKey);
    notifyClientSessionChanged();
  }
};

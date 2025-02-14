import { NextRequest, NextResponse } from "next/server";
import { authKey } from "./constants/AuthKey.constant";
import { decodedToken, validateToken } from "./utils/validateToken";
import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/next";
import { forbidden } from "next/navigation";
import { setUserCountryHeader } from "./lib/userCountryHeader";

export function createRouteMatcher(routes: string[]) {
  // Convert patterns to regular expressions
  const matchers = routes.map((route) => {
    const regex = new RegExp(
      "^" +
        route
          .replace(/\//g, "\\/")
          .replace(/\(\.\*\)/g, ".*")
          .replace(/:[^/]+/g, "[^/]+") +
        "$",
    );
    return regex;
  });

  return (pathname: string) => matchers.some((regex) => regex.test(pathname));
}

const isPublicRoutes = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/verify-email(.*)",
  "/forgot-password(.*)",
  "/reset-password(.*)",
  "/api(.*)",
  "/courses/:courseId/lessons/:lessonId",
  "/products(.*)",
]);

const isCannotAccessAfterAuthRoutes = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/verify-email(.*)",
  "/forgot-password(.*)",
  "/reset-password(.*)",
]);

const isAdminRoutes = createRouteMatcher(["/admin(.*)"]);

const isUserRoutes = createRouteMatcher([
  "/purchases(.*)",
  "/courses(.*)",
  "/profile(.*)",
  "/products/purchase-failure",
  "/products/:productId/purchase",
  "/products/:productId/purchase/success",
]);

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({
      mode: "LIVE",
    }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"],
    }),
    slidingWindow({
      mode: "LIVE",
      interval: "1m",
      max: 100,
    }),
  ],
});

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(authKey)?.value;
  const isValid = token
    ? await validateToken(
        token || "",
        process.env.NEXT_PUBLIC_JWT_SECRET as string,
      )
    : false;
  const decodedTokenData =
    token && isValid
      ? await decodedToken(token, process.env.NEXT_PUBLIC_JWT_SECRET as string)
      : null;

  const userRole = decodedTokenData ? decodedTokenData.data?.role : null;

  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    return forbidden();
  }

  if (isCannotAccessAfterAuthRoutes(pathname)) {
    // If user is already authenticated, redirect to home page
    if (isValid) {
      return NextResponse.redirect(new URL("/not-found", req.nextUrl));
    }
  } else if (isAdminRoutes(pathname)) {
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/not-found", req.nextUrl));
    }
  } else if (isUserRoutes(pathname)) {
    if (!token || !isValid) {
      return NextResponse.redirect(new URL("/sign-in", req.nextUrl));
    }
  } else if (isPublicRoutes(pathname)) {
    console.log("Public route");
  }

  if (!decision.ip.isVpn() && !decision.ip.isProxy()) {
    const headers = new Headers(req.headers);
    setUserCountryHeader(headers, decision.ip.country);

    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*", // Apply middleware to all routes
};

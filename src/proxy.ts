import { NextRequest, NextResponse } from "next/server";
import { authKey } from "./constants/AuthKey.constant";
import { decodedToken, validateToken } from "./utils/validateToken";
import { getJwtSecret } from "./utils/serverEnv";
import { isAdminRole } from "./constants/UserRole.constant";

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

const isPublicLessonRoutes = createRouteMatcher([
  "/courses/:courseId/lessons/:lessonId",
]);

const isSharedAuthenticatedRoutes = createRouteMatcher([
  "/profile(.*)",
  "/courses/:courseId",
]);

const isLearnerRoutes = createRouteMatcher([
  "/purchases(.*)",
  "/courses(.*)",
  "/bookmarks(.*)",
  "/grades(.*)",
  "/products/purchase-failure",
  "/products/purchase-pending",
  "/products/:productId/purchase",
  "/products/:productId/purchase/success",
]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const jwtSecret = getJwtSecret();

  const token = req.cookies.get(authKey)?.value;
  const isValid = token ? await validateToken(token, jwtSecret) : false;
  const decodedTokenData =
    token && isValid
      ? await decodedToken(token, jwtSecret)
      : null;

  const userRole = decodedTokenData ? decodedTokenData.data?.role : null;

  if (isCannotAccessAfterAuthRoutes(pathname)) {
    // If user is already authenticated, redirect to home page
    if (isValid) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  } else if (isAdminRoutes(pathname)) {
    if (!token || !isValid) {
      return NextResponse.redirect(new URL("/sign-in", req.nextUrl));
    }
    if (!isAdminRole(userRole)) {
      return NextResponse.redirect(new URL("/not-found", req.nextUrl));
    }
  } else if (isPublicLessonRoutes(pathname)) {
    console.log("Public lesson route");
  } else if (isSharedAuthenticatedRoutes(pathname)) {
    if (!token || !isValid) {
      return NextResponse.redirect(new URL("/sign-in", req.nextUrl));
    }
  } else if (isLearnerRoutes(pathname)) {
    if (!token || !isValid) {
      return NextResponse.redirect(new URL("/sign-in", req.nextUrl));
    }
    if (isAdminRole(userRole)) {
      return NextResponse.redirect(new URL("/admin", req.nextUrl));
    }
  } else if (isPublicRoutes(pathname)) {
    console.log("Public route");
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*", // Apply middleware to all routes
};

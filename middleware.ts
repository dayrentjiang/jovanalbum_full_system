import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isUserRoute = createRouteMatcher(["/user(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims } = await auth();

  const role = sessionClaims?.metadata?.role;

  // Redirect `admin` role to `/admin` if not already on an admin route
  if (role === "admin" && !isAdminRoute(req)) {
    const adminUrl = new URL("/admin", req.url);
    return NextResponse.redirect(adminUrl);
  }

  // Redirect `member` role to `/user` if not already on a user route
  if (role === "member" && !isUserRoute(req)) {
    const userUrl = new URL("/user", req.url);
    return NextResponse.redirect(userUrl);
  }

  // Protect admin routes
  if (isAdminRoute(req) && role !== "admin") {
    const homeUrl = new URL("/", req.url);
    return NextResponse.redirect(homeUrl);
  }

  // Protect user routes
  if (isUserRoute(req) && role !== "member") {
    const homeUrl = new URL("/", req.url);
    return NextResponse.redirect(homeUrl);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)"
  ]
};

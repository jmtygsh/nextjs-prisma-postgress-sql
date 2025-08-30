
// middleware.ts

import NextAuth from "next-auth";
import authConfig from "./auth.config";
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = ["/signin", "/signup"].includes(nextUrl.pathname);
  const isProtectedRoute = nextUrl.pathname.startsWith("/dashboard");

  if (isApiAuthRoute) {
    return;
  }

  if (isPublicRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
    return;
  }
  
  if (isProtectedRoute && !isLoggedIn) {
    return Response.redirect(new URL("/signin", nextUrl));
  }

  return;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};


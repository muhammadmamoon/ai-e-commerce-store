import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Admin routes protection: only SUPER_ADMIN, ADMIN, or MANAGER
    if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
      const allowedRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER"];
      if (!token || !allowedRoles.includes(token.role as string)) {
        return NextResponse.redirect(
          new URL("/login?error=Unauthorized", req.url),
        );
      }
    }

    // Customer checkout/account protection
    if (pathname.startsWith("/account") || pathname.startsWith("/checkout")) {
      if (!token) {
        return NextResponse.redirect(
          new URL(
            `/login?callbackUrl=${encodeURIComponent(pathname)}`,
            req.url,
          ),
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // Public storefront routes pass through
        if (
          !pathname.startsWith("/admin") &&
          !pathname.startsWith("/dashboard") &&
          !pathname.startsWith("/account") &&
          !pathname.startsWith("/checkout")
        ) {
          return true;
        }
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/account/:path*",
    "/checkout/:path*",
  ],
};

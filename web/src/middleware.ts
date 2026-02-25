import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl;
        const { token } = req.nextauth;

        if (!token) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        // Require admin profile to access the /admin section entirely.
        if (pathname.startsWith("/admin") && token.role !== "admin") {
            return NextResponse.redirect(new URL("/", req.url));
        }

        // Require an admin to explicitly map you to `isApproved` true for access to actual application pages.
        if (pathname === "/" && !token.isApproved) {
            return NextResponse.redirect(new URL("/pending", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

// Apply middleware protection ONLY to exact secure routes.
export const config = {
    matcher: ["/", "/admin/:path*"],
};

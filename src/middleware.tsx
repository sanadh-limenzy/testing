import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const role = req.cookies.get("user_role")?.value;

  if (url.pathname.startsWith("/admin") && role !== "Admin") {
    // return new NextResponse("Page Not Found", { status: 404 });
    return NextResponse.redirect(new URL('/404', req.url));
  }

  if (url.pathname.startsWith("/subscriber") && role !== "Subscriber" && role !== "Admin") {
    // return new NextResponse("Page Not Found", { status: 404 });
    return NextResponse.redirect(new URL('/404', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

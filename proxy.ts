import { NextResponse, type NextRequest } from "next/server";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(request: NextRequest) {
  if (!unsafeMethods.has(request.method)) return NextResponse.next();

  const origin = request.headers.get("origin");
  if (origin && origin === request.nextUrl.origin) return NextResponse.next();

  return NextResponse.json(
    {
      success: false,
      message: "Origem da requisição não é permitida.",
      errors: [],
    },
    { status: 403 },
  );
}

export const config = {
  matcher: "/api/:path*",
};

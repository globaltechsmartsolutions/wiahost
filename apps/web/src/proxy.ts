import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = [
  "/audit",
  "/automations",
  "/calendar",
  "/dashboard",
  "/documents",
  "/guests",
  "/inbox",
  "/incidents",
  "/owners",
  "/payments",
  "/properties",
  "/reservations",
  "/settings",
  "/statements",
  "/tasks",
  "/workflows",
];

const authRoutes = ["/login", "/register"];

type CookieToSync = {
  name: string;
  options: CookieOptions;
  value: string;
};

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(
    url &&
    anonKey &&
    !url.includes("replace_with") &&
    !anonKey.includes("replace_with") &&
    url.startsWith("http"),
  );
}

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function withSyncedCookies(response: NextResponse, cookies: CookieToSync[]) {
  cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = matchesRoute(pathname, protectedRoutes);
  const isAuthRoute = matchesRoute(pathname, authRoutes);

  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  if (!isSupabaseConfigured()) {
    if (!isProtectedRoute) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    url.searchParams.set("error", "Supabase no esta configurado.");

    return NextResponse.redirect(url);
  }

  const cookiesToSync: CookieToSync[] = [];
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookiesToSync.push(...cookies);
          cookies.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = withSyncedCookies(
            NextResponse.next({ request }),
            cookiesToSync,
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);

    return withSyncedCookies(NextResponse.redirect(url), cookiesToSync);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";

    return withSyncedCookies(NextResponse.redirect(url), cookiesToSync);
  }

  return response;
}

export const config = {
  matcher: [
    "/audit/:path*",
    "/calendar/:path*",
    "/automations/:path*",
    "/dashboard/:path*",
    "/documents/:path*",
    "/guests/:path*",
    "/inbox/:path*",
    "/incidents/:path*",
    "/login",
    "/owners/:path*",
    "/payments/:path*",
    "/properties/:path*",
    "/register",
    "/reservations/:path*",
    "/settings/:path*",
    "/statements/:path*",
    "/tasks/:path*",
    "/workflows/:path*",
  ],
};

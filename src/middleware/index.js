import pb from "../lib/pocketbase.js";

const isSecureRequest = (request, url) => {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host") || "";

  return (
    url.protocol === "https:" ||
    forwardedProto === "https" ||
    host.includes("bryan-menoux.fr")
  );
};

const normalizePath = (pathname) => {
  if (!pathname) return "/";
  const trimmed = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return trimmed || "/";
};

export const onRequest = async (context, next) => {
  // Load auth data from cookie if present
  const cookie = context.cookies.get("pb_auth")?.value;
  if (cookie) {
    pb.authStore.loadFromCookie(cookie);
    if (pb.authStore.isValid) {
      context.locals.user = pb.authStore.record;
    }
  }

  const pathname = normalizePath(context.url.pathname);
  const lowerPath = pathname.toLowerCase();

  if (lowerPath.startsWith("/api/")) {
    const publicApiRoutes = ["/api/login", "/api/signup"];
    const isPublicApi = publicApiRoutes.includes(lowerPath);

    if (!context.locals.user && !isPublicApi) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return next();
  }

  if (!context.locals.user) {
    const publicPages = ["/", "/login", "/signup"];
    if (!publicPages.includes(lowerPath)) {
      console.log("Access denied, redirecting to /login:", pathname);
      return Response.redirect(new URL("/login", context.url), 303);
    }
  }

  const isSecure = isSecureRequest(context.request, context.url);

  if (context.request.method === "POST") {
    const referer = context.request.headers.get("referer") || "";
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const sameOrigin =
          refererUrl.hostname === context.url.hostname &&
          refererUrl.port === context.url.port;

        if (!isSecure && !sameOrigin) {
          return new Response("Cross-site POST forbidden", { status: 403 });
        }
      } catch {
        if (!isSecure) {
          return new Response("Cross-site POST forbidden", { status: 403 });
        }
      }
    }

    const form = await context.request.formData().catch(() => null);
    const lang = form?.get("language");

    if (lang === "en" || lang === "fr") {
      context.cookies.set("locale", String(lang), {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        secure: isSecure,
        sameSite: "lax",
      });

      return Response.redirect(
        new URL(context.url.pathname + context.url.search, context.url),
        303
      );
    }
  }

  const cookieLocale = context.cookies.get("locale")?.value;
  context.locals.lang =
    cookieLocale === "fr" || cookieLocale === "en"
      ? cookieLocale
      : context.preferredLocale ?? "en";

  return next();
};

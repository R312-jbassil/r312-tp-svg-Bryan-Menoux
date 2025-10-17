import pb from "../lib/pocketbase.js";

export const onRequest = async (context, next) => {
  const pathname = context.url.pathname;

  // --- AUTHENTIFICATION POCKETBASE ---
  const cookie = context.cookies.get("pb_auth")?.value;
  if (cookie) {
    pb.authStore.loadFromCookie(cookie);
    if (pb.authStore.isValid) {
      context.locals.user = pb.authStore.record;
    }
  }

  // --- ROUTES API ---
  if (pathname.startsWith("/api/")) {
    const publicApiRoutes = ["/api/login", "/api/signup"];

    // Autoriser les deux variantes avec ou sans slash final
    const isPublicApi = publicApiRoutes.some(
      (route) => pathname === route || pathname === route + "/"
    );

    console.log("[Middleware] API hit:", pathname, "| Public:", isPublicApi);

    // Si ce n’est pas une route publique et pas connecté → 401
    if (!context.locals.user && !isPublicApi) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Toujours continuer vers la page /api correspondante
    return next();
  }

  // --- REDIRECTION SI NON CONNECTÉ ---
  if (!context.locals.user) {
    const publicPages = ["/login", "/signup", "/"];
    const isPublicPage = publicPages.some(
      (page) => pathname === page || pathname === page + "/"
    );

    if (!isPublicPage) {
      console.log("[Middleware] Redirect to /login for", pathname);
      return Response.redirect(new URL("/login/", context.url), 303);
    }
  }

  // --- LOG DÉBOGAGE ---
  console.log("[Middleware] Page hit:", pathname);

  // --- GESTION DE LA LANGUE ---
  if (context.request.method === "POST") {
    const form = await context.request.formData().catch(() => null);
    const lang = form?.get("language");
    if (lang === "en" || lang === "fr") {
      context.cookies.set("locale", String(lang), {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
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

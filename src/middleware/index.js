import pb from "../lib/pocketbase.js";

export const onRequest = async (context, next) => {
  // --- Auth depuis le cookie ---
  const cookie = context.cookies.get("pb_auth")?.value;
  if (cookie) {
    pb.authStore.loadFromCookie(cookie);
    if (pb.authStore.isValid) {
      context.locals.user = pb.authStore.record;
    }
  }

  // --- Routes API ---
  if (context.url.pathname.startsWith("/apis/")) {
    const publicApiRoutes = ["/apis/login", "/apis/signup"];
    if (
      !context.locals.user &&
      !publicApiRoutes.includes(context.url.pathname)
    ) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return next();
  }

  // --- Redirection pages protégées ---
  if (!context.locals.user) {
    const publicPages = ["/login", "/signup", "/"];
    if (!publicPages.includes(context.url.pathname)) {
      return Response.redirect(new URL("/login", context.url), 303);
    }
  }

  // --- Détection HTTPS (vérifie aussi si domaine public) ---
  const host = context.request.headers.get("host") || "";
  const isSecure =
    context.url.protocol === "https:" ||
    context.request.headers.get("x-forwarded-proto") === "https" ||
    host.includes("bryan-menoux.fr"); // ✅ ton domaine prod toujours en HTTPS

  // --- Gestion du changement de langue ---
  if (context.request.method === "POST") {
    // ⚠️ On ne bloque que les POST externes non sécurisés
    const referer = context.request.headers.get("referer") || "";
    if (!isSecure && referer.includes("https://")) {
      return new Response("HTTPS required", { status: 403 });
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

  // --- Langue par défaut ---
  const cookieLocale = context.cookies.get("locale")?.value;
  context.locals.lang =
    cookieLocale === "fr" || cookieLocale === "en"
      ? cookieLocale
      : context.preferredLocale ?? "en";

  return next();
};
